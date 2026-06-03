const ontology = {};

export function addOntology(child,parent){

    ontology[child]=parent;

}

export function getParent(node){

    return ontology[node] || null;

}

export function getOntology(){

    return ontology;

}
