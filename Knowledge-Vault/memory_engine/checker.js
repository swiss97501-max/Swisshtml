import { normalize } from "./normalize.js";

export function findContradictions(claims) {

    const contradictions = [];

    for(let i=0;i<claims.length;i++) {

        for(let j=i+1;j<claims.length;j++) {

            const a = normalize(claims[i].original);
            const b = normalize(claims[j].original);

            if(
                a.includes("not") &&
                b.replace("not ","") === a.replace("not ","")
            ){

                contradictions.push({
                    claimA: claims[i].id,
                    claimB: claims[j].id,
                    reason: "Negation Conflict"
                });

            }

        }

    }

    return contradictions;

}
