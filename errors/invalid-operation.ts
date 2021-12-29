export default class InvalidOperationError extends Error{
    
    resourceId: string;

    constructor(message:string){
        super(message);
    }
}