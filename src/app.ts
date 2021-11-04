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
            .catch((error) => {
                console.error(error);
                res.sendStatus(500)
            })

        console.log("Import end");
    })

    app.get("/ligne/:compteId", function (req: Request, res: Response) {
        connection.getRepository(Ligne)
            .find({ where: { compte: { id: req.params.compteId } } })
            .then(lignes => res.json(lignes))
    })


    app.delete("/categorie", function (req: Request, res: Response) {
        const repo: Repository<Categorie> = connection.getRepository(Categorie)
        const entityToDelete = repo.create(req.body as DeepPartial<Categorie>)
        repo.findOneOrFail(entityToDelete.id)
            .then(c => {
                if (c.children && c.children.length > 0) {
                    throw new Error("Cannot remove category because it has children")
                } else {
                    console.log("deleting");

                    return repo.delete(entityToDelete)
                }
            }).then(() => {
                res.sendStatus(200)
            }).catch((error: Error) => {
                console.error(error.message);
                res.sendStatus(500)
            })
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
            .then(() => res.sendStatus(200))
            .catch(error => {
                res.sendStatus(500)
                console.error(error);
            })
    });

    app.get(baseUrl, function (req: Request, res: Response) {
        repo.find(opts)
            .then((entities) => {
                res.status(200)
                res.send(entities)
            })
            .catch(error => {
                res.sendStatus(500)
                console.error(error);
            })
    });
}

