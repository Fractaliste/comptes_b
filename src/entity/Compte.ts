import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Ligne } from "./Ligne";

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

}
