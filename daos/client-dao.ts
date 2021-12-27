import { ClientContext, CosmosClient } from "@azure/cosmos";
import {v4} from "uuid";
import Client from "../entities/client";
import Account from "../entities/account";
import NotFoundError from "../errors/not-found-error";
import { response } from "express";

const dbclient = new CosmosClient(process.env.COSMOS_CONNECTION);
const database = dbclient.database("banking-api");
const container = database.container("clients");

export default interface ClientDAO{
    createClient(client :Client): Promise<Client>;

    getAllClients(): Promise<Client[]>;
    getClientById(id: string): Promise<Client>;
    updateClient(client: Client): Promise<Client>;
    deleteClient(id: string): Promise<Client>; // remember to return a Client object.
    
}

export class ClientDao implements ClientDAO{
    async createClient(client: Client): Promise<Client> {
        client.id = v4();
        const response = await container.items.create(client);
        return response.resource;

    }
    async getAllClients(): Promise<Client[]> {
        const response = await container.items.readAll<Client>().fetchAll();
        return response.resources;
    }
    async getClientById(id: string): Promise<Client> {
        const response = await container.item(id, id).read();
        if (!response.resource){
            throw new NotFoundError("Resource could not be found", id);
        }

        return response.resource;
    }
    async updateClient(client: Client): Promise<Client> {
        const response = await container.item(client.id).replace(client);
        return response.resource;
    }
    async deleteClient(id: string): Promise<Client> {
        const client = await this.getClientById(id);
        const response = await container.item(id, id).delete();
        return client;
    }

}