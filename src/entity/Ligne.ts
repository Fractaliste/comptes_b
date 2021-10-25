import { Column, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Categorie } from "./Categorie";
import { Compte } from "./Compte";
import { Releve } from "./Releve";
import { Tier } from "./Tier";

@Entity()
export class Ligne {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(type => Categorie, { nullable: false })
    categorie: Categorie;

    @ManyToOne(type => Tier, { nullable: false })
    tier: Tier;

    @ManyToOne(type => Compte, compte => compte.lignes, { nullable: false })
    compte: Compte;

    @Column({ nullable: false })
    date: Date

    @Column({ nullable: false })
    valeur: number

    @Column()
    note: string

    @ManyToOne(type => Releve)
    rapprochement: Releve

    @Column()
    isHorsBudget: boolean

    @OneToOne(type => Ligne, ligne => ligne.virement)
    virement?: Ligne
}
