import { Connection, Repository } from "typeorm";
import { Categorie } from "./entity/Categorie";
import { Compte } from "./entity/Compte";
import { Ligne } from "./entity/Ligne";
import { Tier } from "./entity/Tier";

export class ImportController {
    categorieRepo: Repository<Categorie>;
    ligneRepo: Repository<Ligne>;
    tierRepo: Repository<Tier>;
    compteRepo: Repository<Compte>;

    constructor(connection: Connection) {
        this.ligneRepo = connection.getRepository(Ligne)
        this.categorieRepo = connection.getRepository(Categorie)
        this.tierRepo = connection.getRepository(Tier)
        this.compteRepo = connection.getRepository(Compte)
    }

    handleLignes(body: string,): Promise<any> {

        const blocks = body.split("^\r\n")
        let allPromises = blocks.map(b => b.split("\r\n"))
            .filter(b => b[0] !== "")
            .map((b, i) => {
                console.log(b, i);

                const dateString = b.find(s => /^D.*/.test(s))
                const date = new Date(Number(dateString.substring(7)), Number(dateString.substring(4, 6)) - 1, Number(dateString.substring(1, 3)), 12, 0, 0)

                const montant = b.find(s => /^T.*/.test(s)).substring(1).replace(",", "")
                const note = (b.find(s => /^M.*/.test(s)) || "0").substring(1)
                const categorieString = b.find(s => /^L.*/.test(s)).substring(1)
                const categoriePromise = this.getCategorie(categorieString);
                const tier = (b.find(s => /^P.*/.test(s)) || "P" + categorieString).substring(1)
                const tierPromise = this.getOrCreateTier(tier)

                Promise.all([categoriePromise, tierPromise, this.getCompte(2)]).then((result) => {

                    let [categorie, tier, comptes] = result

                    const l = new Ligne()
                    l.valeur = Number(montant)
                    l.note = note
                    l.date = date
                    l.tier = tier
                    l.isHorsBudget = false
                    l.categorie = categorie
                    l.compte = comptes[0]
                    console.log(l, categorieString);
                    return this.ligneRepo.insert(l)
                })

            })



        return Promise.all(allPromises)

    }

    private getCategorie(categorie: string): Promise<Categorie> {
        if (/^\[.*\]$/.test(categorie)) {
            // Virement interne
            return this.categorieRepo.find({ where: { name: "Virement interne" } })
                .then(categories => {
                    if (categories.length === 0) {
                        const c = new Categorie();
                        c.type = "COURANTE";
                        c.name = "Virement interne";
                        return this.categorieRepo.insert(c)
                            .then(insertResult => {
                                console.log("insertResult", insertResult);

                                return insertResult.generatedMaps[0] as Categorie
                            });
                    } else {
                        return categories[0];
                    }
                });
        } else {
            const catSplitted = categorie.split(":");
            const targetCat = catSplitted.pop();
            return this.categorieRepo.find({ where: { name: targetCat } }).then(result => result[0]);
        }
    }

    handleCategories(body: string) {
        const lines = body.split("\r\n")


        const regex = /^L[^[](.*)$/g
        const categories = lines.filter(l => regex.exec(l))
            .map(l => l.substring(1))
            .map(l => l.split(":"))


        let catRacines = categories.map(categories => {
            if (categories.length > 2) {
                console.error("Current cat", categories);
                throw Error("Categorie length is > 1")
            }
            return categories[0]


        })
        const catRacinesPromises = Array.from(new Set(catRacines))
            .map(c => {
                return this.categorieRepo.find({ where: { name: c } })
                    .then(entities => {
                        if (entities.length === 0) {
                            const entity = new Categorie()
                            entity.name = c
                            entity.type = "COURANTE"
                            return this.categorieRepo.insert(entity)
                        }

                    })
            })


        const catFillesPromises = Promise.all(catRacinesPromises)
            .then(() => {
                const toPersist = {}
                categories.filter(c => c.length > 1)
                    .forEach(c => {
                        if (!toPersist[c[0]]) {
                            toPersist[c[0]] = {}
                        }
                        if (!toPersist[c[0]][c[1]]) {
                            toPersist[c[0]][c[1]] = 1
                        }
                    })

                return Promise.all(Object.entries(toPersist)
                    .map(entry => {
                        return this.categorieRepo.find({ where: { name: entry[0] } })
                            .then(catMere => {
                                if (catMere.length !== 1) {
                                    console.error("Cat mère", catMere);
                                    throw Error("Categorie mère is != 1")
                                }
                                const parent = catMere[0]
                                return Promise.all(Object.keys(entry[1])
                                    .map(c => {
                                        return this.categorieRepo.find({ where: { name: c } })
                                            .then(catFounds => {
                                                if (catFounds.length === 0) {
                                                    const entity = new Categorie()
                                                    entity.name = c
                                                    entity.type = "COURANTE"
                                                    entity.parent = parent
                                                    return this.categorieRepo.insert(entity)
                                                        .then(inserted => {
                                                            console.log("Inserted", inserted);
                                                            return
                                                        })
                                                } else {
                                                    return
                                                }
                                            })

                                    }))
                            })

                    })
                )
            })


        return catFillesPromises


    }

    getOrCreateTier(tierString: string): Promise<Tier> {
        return this.tierRepo.find({ where: { name: tierString } })
            .then(tiers => {
                if (tiers.length === 0) {
                    const t = new Tier()
                    t.name = tierString
                    return this.tierRepo.insert(t)
                        .then(iResult => iResult.generatedMaps[0] as Tier)
                        .catch(() => this.getOrCreateTier(tierString))
                } else {
                    return tiers[0]
                }
            })
    }

    getCompte(id: number) {
        return this.compteRepo.findByIds([id])
    }
}

