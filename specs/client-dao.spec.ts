import { isRegularExpressionLiteral } from "typescript";
import ClientDAO, { ClientDao } from "../daos/client-dao"
import Account from "../entities/account";
import Client from "../entities/client";
import NotFoundError from "../errors/not-found-error";


describe("Client DAO Tests", ()=>{

    const clientDao: ClientDAO = new ClientDao();
    let savedResult: Client = null;

    it("should create a Client and return a 201 status code", async () => {
        const testClient: Client = {fname: "John", lname:"Zoidberg", accounts: [], id: ''};
        savedResult = await clientDao.createClient(testClient);
        expect(savedResult.id).not.toBeFalsy();
    })

    it("should get all Clients", async () =>{
        const clients: Client[] = await clientDao.getAllClients();
        expect(clients.length).toBeGreaterThan(0);

    })

    it("should get a specific Client by ID", async ()=>{
        let result = await clientDao.getClientById(savedResult.id);
        expect(result.fname).toBe(savedResult.fname);
    })

    it("should update the contents of a Client object", async()=>{
        const updatedClient: Client = {"id": savedResult.id, 
        "fname": "Hubert", "lname": "Farnsworth", "accounts": []}
        let result = await clientDao.updateClient(updatedClient);
        expect(result.id).toEqual(savedResult.id);
        expect(result.fname).toEqual("Hubert")
        expect(result.lname).toEqual("Farnsworth");
    })

    it("should delete a Client", async ()=>{
        let response = await clientDao.deleteClient(savedResult.id);
        expect(async()=>{
            await clientDao.getClientById(savedResult.id);
        }).rejects.toThrowError(NotFoundError);
    })
})