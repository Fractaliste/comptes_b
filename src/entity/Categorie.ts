import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Categorie {

    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true, nullable: false })
    name: string;

    @Column()
    type: "FIXE" | "COURANTE" | "EXCEPTIONNELLE";

    @OneToMany(type => Categorie, categorie => categorie.parent)
    children: Categorie[];

    @ManyToOne(type => Categorie, categorie => categorie.children)
    parent: Categorie;

}
