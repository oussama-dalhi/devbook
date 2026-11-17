/*
  Warnings:

  - You are about to drop the column `isActive` on the `User` table. All the data in the column will be lost.
  - Added the required column `name` to the `User` table without a default value. This is not possible if the table is not empty.

*/
ALTER TABLE "Post" ADD COLUMN     "title" VARCHAR(100);

ALTER TABLE "User" DROP COLUMN "isActive",
ADD COLUMN     "name" VARCHAR(100) NOT NULL;
