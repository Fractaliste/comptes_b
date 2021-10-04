import { Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Releve {
    @PrimaryGeneratedColumn()
    id: number;
}
