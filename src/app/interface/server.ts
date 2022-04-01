import { Status } from "../enum/status.enum";

export interface Server{
    id: number;
    ipAddress: String;
    name: String;
    memory: String;
    type: String;
    imageURL: String;
    status: Status;
}