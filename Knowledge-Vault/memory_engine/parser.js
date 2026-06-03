export function parseClaim(sentence){

    const parts = sentence.split(" ");

    if(parts.length < 3){

        return null;

    }

    return {

        subject: parts[0],

        predicate: parts[1],

        object: parts.slice(2).join(" ")

    };

}
