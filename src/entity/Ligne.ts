import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Categorie } from "./Categorie";
import { Compte } from "./Compte";
import { Releve } from "./Releve";
import { Tier } from "./Tier";

@Entity()
export class Ligne {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(type => Categorie)
    categorie: Categorie;

    @ManyToOne(type => Tier)
    tier: Tier;

    @ManyToOne(type => Compte, compte => compte.lignes)
    compte: Compte;

    @Column()
    date: Date

    @Column()
    note: string

    @ManyToOne(type => Releve)
    rapprochement: Releve

    @Column()
    isHorsBudget: boolean
}
