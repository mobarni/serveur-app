import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { BehaviorSubject, catchError, map, Observable, of, startWith } from 'rxjs';
import { DataState } from './enum/data-state.enum';
import { Status } from './enum/status.enum';
import { AppState } from './interface/app-state';
import { CustomResponse } from './interface/custom-response';
import { Server } from './interface/server';
import { ServerService } from './service/server.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit{
  appState$: Observable<AppState<CustomResponse>>;
  readonly DataState = DataState;
  readonly Status = Status;
  private dataSubject = new BehaviorSubject<CustomResponse>(null);
  private filterSubject = new BehaviorSubject<String>('');
  filterStatus$ = this.filterSubject.asObservable();
  private isLoading = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoading.asObservable();

  constructor(private serverService: ServerService){}

  ngOnInit(): void {
      this.appState$ = this.serverService.server$
      .pipe(
        map( response => {
            this.dataSubject.next(response);
            return { dataState: DataState.LOADED_STATE, appData: response}
          }),
        startWith({ dataState: DataState.LOADING_STATE}),
        catchError((error: String) => {
          return of({ dataState: DataState.ERROR_STATE, error })
        })
      );
  }

  pingServer(ipAddress: String): void {
    this.filterSubject.next(ipAddress);
    this.appState$ = this.serverService.ping$(ipAddress)
    .pipe(
      map( response => {
          const index = this.dataSubject.value.data.servers.findIndex(server => server.id === response.data.server.id)
          this.dataSubject.value.data.servers[index] = response.data.server
          return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }
        }),
      startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),
      catchError((error: String) => {
        this.filterSubject.next('');
        return of({ dataState: DataState.ERROR_STATE, error })
      })
    );
  }

  saveServer(serverForm: NgForm): void {
    this.isLoading.next(true);
    this.appState$ = this.serverService.save$(serverForm.value as Server)
    .pipe(
      map( response => {
          this.dataSubject.next(
            {...response, data: { servers: [response.data.server, ...this.dataSubject.value.data.servers] }}
          );
          document.getElementById('closeModal').click();
          this.isLoading.next(false);
          serverForm.resetForm({ status: this.Status.SERVER_DOWN});
          return { dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }
        }),
      startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),
      catchError((error: String) => {
        this.isLoading.next(false);
        return of({ dataState: DataState.ERROR_STATE, error })
      })
    );
  }

  filterServer(status: Status): void {
    this.appState$ = this.serverService.filter$(status, this.dataSubject.value)
    .pipe(
      map( response => {
          return { dataState: DataState.LOADED_STATE, appData: response }
        }),
      startWith({ dataState: DataState.LOADED_STATE, appData: this.dataSubject.value }),
      catchError((error: String) => {
        return of({ dataState: DataState.ERROR_STATE, error })
      })
    );
  }
}
