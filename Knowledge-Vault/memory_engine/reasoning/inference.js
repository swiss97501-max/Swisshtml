import { getParent } from "../ontology.js";

export function inferIsA(entity){

    const chain=[];

    let current=entity;

    while(current){

        chain.push(current);

        current=getParent(current);

    }

    return chain;

}
