import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Ligne } from "./Ligne";
import { Releve } from "./Releve";

@Entity()
export class Compte {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    soldeInitial: number;

    @OneToMany(type => Ligne, ligne => ligne.compte)
    lignes: Ligne[];

    @OneToMany(type => Releve, releve => releve.compte)
    releves: Releve[];

}
