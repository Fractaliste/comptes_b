import * as express from "express";
import { Request, Response } from "express";
import { Connection, createConnection, DeepPartial, Entity, Repository } from "typeorm";
import "reflect-metadata";
import { ImportController } from "./import";
import { Categorie } from "./entity/Categorie";
import { Ligne } from "./entity/Ligne";

const app = express();
app.use(express.json()) // for parsing application/json
app.use(express.text()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded

createConnection().then(connection => {

    listenToDefault(connection, "categorie", { relations: ["parent", "children"] })
    listenToDefault(connection, "compte")
    listenToDefault(connection, "ligne")
    listenToDefault(connection, "releve")
    listenToDefault(connection, "tier")

    app.post("/import", function (req: Request, res: Response) {
        console.log("Import starting %s", req.headers["content-type"]);

        const ctroler = new ImportController(connection)
        const c = ctroler.handleCategories(req.body)
        const l = ctroler.handleLignes(req.body)

        Promise.all([c, l])
            .then(() => res.sendStatus(200))
            .catch(errorFunction(res))

        console.log("Import end");
    })



    app.get("/ligne/statistique", function (req: Request, res: Response) {
        connection.getRepository(Ligne)
            .find({ relations: ["categorie"] })
            .then(lignes => {
                return lignes.reduce((prev: any, current: Ligne) => {
                    const cat = current.categorie
                    if (!prev[cat.name]) {
                        prev[cat.name] = { nb: 0, sum: 0 }
                    }
                    prev[cat.name].nb++
                    prev[cat.name].sum += current.valeur
                    return prev
                }, {})
            })
            .then(stats => res.json(stats))
            .catch(errorFunction(res))
    })

    app.get("/ligne/:compteId", function (req: Request, res: Response) {
        connection.getRepository(Ligne)
            .find({
                where: { compte: { id: req.params.compteId } },
                relations: ["categorie", "tier", "rapprochement", "virement"]
            })
            .then(lignes => res.json(lignes))
            .catch(errorFunction(res))
    })

    app.delete("/ligne", function (req: Request, res: Response) {

        const repo: Repository<Ligne> = connection.getRepository(Ligne)
        const entityToDelete = repo.create(req.body as DeepPartial<Ligne>)

        repo.findOneOrFail(entityToDelete.id)
            .then(l => {
                if (l.rapprochement) {
                    throw new Error("Cannot remove ligne because it has been checked")
                } else {
                    return repo.remove(l)
                }
            })
            .then(() => repo.findOne(entityToDelete.id))
            .then((ligne) => {
                if (ligne) {
                    console.error("Impossible de supprimer", ligne);
                    res.sendStatus(500)
                } else {
                    res.status(200)
                    res.json(entityToDelete.id)
                }
            }).catch(errorFunction(res))
    })
    app.delete("/categorie", function (req: Request, res: Response) {
        const repo: Repository<Categorie> = connection.getRepository(Categorie)
        const entityToDelete = repo.create(req.body as DeepPartial<Categorie>)
        repo.findOneOrFail(entityToDelete.id)
            .then(c => {
                if (c.children && c.children.length > 0) {
                    throw new Error("Cannot remove category because it has children")
                } else {
                    return repo.delete(c)
                }
            }).then((deleteResult) => {
                res.sendStatus(200)
            }).catch(errorFunction(res))
    })

    app.listen(3000, () => console.log("Listening port 3000"))

})

function errorFunction(res: express.Response<any, Record<string, any>>): (reason: any) => void | PromiseLike<void> {
    return (error) => {
        console.error(error);
        res.sendStatus(500);
    };
}

function listenToDefault(connection: Connection, dtoName: string, opts?) {
    const repo = connection.getRepository(dtoName);
    const baseUrl = `/${dtoName}`

    app.post(baseUrl, function (req: Request, res: Response) {
        console.log("Entity", req.body);
        const entity = repo.create(req.body);

        repo.save(entity)
            .then((record) => res.json(record))
            .catch(error => {
                res.sendStatus(500)
                console.error(error);
            })
    });

    app.get(baseUrl, function (req: Request, res: Response) {
        repo.find(opts)
            .then((entities) => {
                res.status(200)
                res.json(entities)
            })
            .catch(error => {
                res.sendStatus(500)
                console.error(error);
            })
    });
}

