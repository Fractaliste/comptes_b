import { Column, Entity, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Compte } from "./Compte";
import { Ligne } from "./Ligne";

@Entity()
export class Releve {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ default: false })
    clot: boolean;

    @ManyToOne(type => Compte, { nullable: false })
    compte: Compte;

    @Column({ nullable: false })
    date: Date;

    @Column({ nullable: false })
    solde: number;

    @OneToMany(type => Ligne, ligne => ligne.rapprochement)
    lignes: Ligne[]
}
