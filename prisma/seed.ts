import { PrismaClient } from '@prisma/client';

const militaryNames = [
  "Recruta",
  "Soldado",
  "Cabo",
  "Sargento",
  "Subtenente",
  "Aspirante a Oficial",
  "Tenente",
  "Capitão",
  "Major",
  "Coronel",
  "General",
  "Comandante",
  "Comandante-Geral",
  "Conselheiro",
  "Supremo"
]

const executiveNames = [
  "Estagiário",
  "Agente",
  "Perito",
  "Escrivão",
  "Investigador",
  "Delegado",
  "Comissário",
  "Analista",
  "Diretor",
  "Acionista",
  "Chanceler",
]


const promotionRange = [
  militaryNames.indexOf("Recruta"), // recruta
  militaryNames.indexOf("Recruta"), // soldado
  militaryNames.indexOf("Recruta"), // cabo
  militaryNames.indexOf("Recruta"), // sargento
  militaryNames.indexOf("Soldado"), // subtenente
  militaryNames.indexOf("Cabo"), // aspirante
  militaryNames.indexOf("Subtenente"), // tenente
  militaryNames.indexOf("Subtenente"), // capitão
  militaryNames.indexOf("Aspirante a Oficial"), // major
  militaryNames.indexOf("Tenente"), // coronel
  militaryNames.indexOf("Capitão"), // general
  militaryNames.indexOf("Major"), // comandante
  militaryNames.indexOf("Coronel"), // comandante geral
  militaryNames.indexOf("Comandante"), // conselheiro
  militaryNames.indexOf("Comandante-Geral") // supremo
]

const adminUsers = [
  {
    nick: "HaveSomeHope!",
    isAdmin: true,
    roleName: "Conselheiro"
  },
  {
    nick: "Realgabri169",
    isAdmin: true,
    roleName: "Supremo"
  },
  {
    nick: "Rakis",
    isAdmin: true,
    roleName: "Supremo"
  }
]

const daysToBePromoted = [
  0, // recruta
  0, // soldado
  1, // cabo
  2, // sargento
  3, // subtenente
  7, // aspirante a oficial
  12, // tenente
  15, // capitão
  20, // major
  25, // coronel
  30, // general
  60, // comandante
  0, // comandante-geral
  0, // conselheiro
  0 // supremo
]


const prisma = new PrismaClient()

async function main () {
  const roles = [];
  militaryNames.forEach( (role, index) => {
    const roleObject = {
      name: role,
      hierarchyKind: "MILITARY",
      hierarchyPosition: index,
      promotesUntilRolePosition: promotionRange[index],
      demoteUntilRolePosition: (index <= 4 ? 0 : index-1),
      fireUntilRolePosition: (index <= 5 ? 0 : index-1),
      gratifyUntilRolePosition: (index <= 4 ? 0 : index-1),
      daysToBePromoted:  daysToBePromoted[index],
    }
    roles.push(roleObject);
  })
  executiveNames.forEach((role, index) => {
    const idx = index + 2;
    const roleObject = {
      name: role,
      hierarchyKind: "EXECUTIVE",
      hierarchyPosition: idx,
      promotesUntilRolePosition: promotionRange[idx],
      demoteUntilRolePosition: (idx <= 4 ? 0 : idx-1),
      fireUntilRolePosition: (idx <= 5 ? 0 : idx-1),
      gratifyUntilRolePosition: (idx <= 4 ? 0 : idx-1),
      daysToBePromoted:  daysToBePromoted[idx],
    }
    roles.push(roleObject);
  })
  try {
    await prisma.roles.createMany({
      data: roles
    })
    console.log("Cargos criados.")
  } catch {
    console.log("Não foi possível criar os cargos.")
  }

  try {
    await prisma.user.createMany({
      data: adminUsers
    })
    console.log("Usuários administradores criados")
  } catch {
    console.log("Não foi possível criar os usuários.")
  }


}



main().finally(async() =>  await prisma.$disconnect())
