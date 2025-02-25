const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
    name: "User",
    tableName: "USER",
    columns: {
      id: {
        primary: true,
        type: "uuid",
        generated: "uuid",
        nullable: false
      },
      name: {
        type: "varchar",
        length: 50,
        nullable: false,
      },
      email: {
        type: "varchar",
        length: 320,
        nullable: false,
        unique: true
      },
      role:{
        type: "varchar",
        length: 20,
        nullable: false
      },
      password: {
        type: "varchar",
        length: 72,
        nullable: false,
        select: false
      },
      createdAt: {
        type: "timestamp",
        createDate: true,
        name: "created_at",
        nullable: false
      },
      updatedAt: {
        type: "timestamp",
        updateDate: true,
        name: "updated_at",
        nullable: false,
      }
    }
})