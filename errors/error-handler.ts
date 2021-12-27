import {Response} from "express";
import InsuficcientBalanceError from "./InsufficientBalanceError";
import NotFoundError from "./not-found-error";

export default function errorHandler(error:Error, res:Response, resourceType:string){
    if (error instanceof NotFoundError){
        res.status(404);
        res.send(`${resourceType} resource not found`);
    }
    else if (error instanceof InsuficcientBalanceError){
        res.status(422);
        res.send("Insufficient balance in requested account.");
    }
    else {
        res.status(500);
        res.send("Server Error");
    }
}