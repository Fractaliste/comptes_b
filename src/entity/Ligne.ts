import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
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

    @Column({ nullable: false})
    valeur: number

    @Column({ nullable: true })
    note: string

    @Column({ nullable: true })
    numeroCheque: number

    @ManyToOne(type => Releve)
    rapprochement: Releve

    @Column({ default: false })
    isHorsBudget: boolean

    @OneToOne(type => Ligne, ligne => ligne.virement)
    @JoinColumn()
    virement?: Ligne
}
