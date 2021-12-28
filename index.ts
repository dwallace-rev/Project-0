import express from "express";
import Client from "./entities/client";
import Account from "./entities/account";
import ClientDAO, { ClientDao } from "./daos/client-dao";
import errorHandler from "./errors/error-handler";
import NotFoundError from "./errors/not-found-error";
import { ModifierFlags, setOriginalNode } from "typescript";
import InsuficcientBalanceError from "./errors/InsufficientBalanceError";
import { QueryMetricsConstants } from "@azure/cosmos";

const app = express();
app.use(express.json());
const clientDao: ClientDAO = new ClientDao();

app.post("/clients", async (req,res) =>{
    // Create new client, return 201 status.
    const client: Client = req.body;
    const savedClient: Client = await clientDao.createClient(client);
    res.status(201);
    res.send(savedClient);
})

app.get("/clients", async (req, res)=>{
    // Get All Clients, return 200 status.
    const clients: Client[] = await clientDao.getAllClients();
    res.status(200);
    res.send(clients);
})

app.get("/clients/:id", async (req, res) =>{
    // get client by id, return 404 if no such client exists
    try{
        const {id} = req.params;
        const client: Client = await clientDao.getClientById(id);
        res.send(client);
    } catch (error){
        errorHandler(error, res, "Client");
    }
})

app.put("/clients/:id", async (req, res) =>{
    // Update existing client by id, return 404 if no such client exists
    const {id} = req.params;
    const client: Client = req.body;
    try{
        const originalClient = await clientDao.getClientById(id);
        client.id = originalClient.id;
        client.accounts = originalClient.accounts;
        const updatedClient: Client = await clientDao.updateClient(client);
        res.send(`Update successful! Client id: ${updatedClient.id}`);

    }catch(error){
        errorHandler(error, res, "Client");
    }
    
})

app.delete("/clients/:id", async (req, res)=>{
    // Delete client by id, return 404 if no exist, 205 if successful.
    const {id} = req.params;
    try{        
        const client: Client = await clientDao.deleteClient(id);
        res.status(205);
        res.send(`Deleted client with id: ${client.id}`);
    }
    catch(error){
        errorHandler(error, res, "Client");
    }
})

app.post("/clients/:id/accounts", async (req, res)=>{
    // Create new account for client with given id. Return 404 if client doens't exist.
    // Name for new account is provided by JSON sent.    
    const {id} = req.params;
    const name = req.body.name;
    const account: Account = {"name": name, "balance": 0}; //creating the Account obj
    try{
        const client: Client = await clientDao.getClientById(id);
        client.accounts.push(account); //add new account to existing array.

        const updated = await clientDao.updateClient(client);

        res.status(201);
        res.send(`Successfully created account '${name}' for user id: ${id}`);

    } catch (error){
        errorHandler(error, res, "Client");
    }

})

app.get("/clients/:id/accounts", async (req, res)=>{
    // Get all accounts for given client. Return 404 if no client exists.
    // Accept query with params:"amountLessThan" and "amountGreaterThan"
    const {id} = req.params;
    const query = req.query;
    try {
        const client: Client = await clientDao.getClientById(id);
        let accounts: Account[] = client.accounts;
        
        let max, min;
        let result: Account[] = [];

        if(query.amountLessThan && query.amountGreaterThan){
            max = Number(query.amountLessThan);
            min = Number(query.amountGreaterThan);

            accounts.forEach(i => {
                if (i.balance >= min && i.balance <= max){
                    result.push(i);
                }
            });
        }           
        else if(query.amountLessThan){
            max = Number(query.amountLessThan);
            accounts.forEach(i => {
                if(i.balance <= max) result.push(i);
            })
        }
        else if(query.amountGreaterThan){
            min = Number(query.amountGreaterThan)
            accounts.forEach(i => {
                if (i.balance >= min) result.push(i);
            });
        }        
        else{
            res.status(200);
            res.send(accounts);
        }

        if (result.length > 0){
            res.status(200);
            res.send(result);
        }
        else {
            res.status(404)
            res.send("No accounts found matching provided values");
        }
        

    } catch (error){
        errorHandler(error, res, "Client");
    }
})

app.patch("/clients/:id/accounts/:name/deposit", async (req, res)=>{
    // deposit given amount (Body {"amount": 500}) return 404 if no account exists.
    let errType = "Client";
    const {id,name} = req.params;
    const deposit = Number(req.body.amount);
    try{
        const client: Client = await clientDao.getClientById(id)
        errType = "Account"; //if it passes the previous line of code, then Client is not throwing the 404.
        const modifiedAccount = client.accounts.findIndex(i=> i.name === name);
        if (modifiedAccount != -1){
            const newbal = client.accounts[modifiedAccount].balance += deposit;
            clientDao.updateClient(client);
            res.status(200);
            res.send(`New balance is: $${newbal}`);
        }

        else throw new NotFoundError("No such Account exists", name);

    }catch(error){
        errorHandler(error, res, errType);
    }
})

app.patch("/clients/:id/accounts/:name/withdraw", async (req, res)=>{
    // withdraw given amount (Body {"amount", 500}) return 404 if no account exists.
    let errType = "Client";
    const {id, name} = req.params;
    const withdraw = Number(req.body.amount);
    try{
        const client: Client = await clientDao.getClientById(id);
        errType = "Account";
        const modifiedAccount = client.accounts.findIndex(i=> i.name === name);
        if (modifiedAccount != -1){
            if (client.accounts[modifiedAccount].balance >= withdraw){
                const newbal = client.accounts[modifiedAccount].balance -= withdraw;
            clientDao.updateClient(client);
            res.status(200);
            res.send(`New balance is: $${newbal}`)
            }
            else throw new InsuficcientBalanceError("Insufficient Balance");
        }
        else throw new NotFoundError("No such account exists", name);
    }
    catch (error){
        errorHandler(error, res, errType);
    }
})


app.listen(3000, ()=> console.log("Application Started: Listening on port 3000"));
