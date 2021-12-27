export default class InsuficcientBalanceError extends Error{
    
    resourceId: string;

    constructor(message:string){
        super(message);
    }
}