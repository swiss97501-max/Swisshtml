const aliases = {};

export function addAlias(main,alias){

    if(!aliases[main]){

        aliases[main]=[];

    }

    aliases[main].push(alias);

}

export function resolve(term){

    for(const main in aliases){

        if(main===term) return main;

        if(aliases[main].includes(term)){

            return main;

        }

    }

    return term;

}
