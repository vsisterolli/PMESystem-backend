import { Prisma, PrismaClient } from "@prisma/client";

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
];

const executiveNames = [
    "Estagiário",
    "Analista",
	"Agente",
    "Inspetor",
    "Perito",
	"Escrivão",
    "Investigador",
	"Delegado",
    "Comissário",
	"Diretor",
    "Chanceler"
];

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
];

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
];

const daysToBePromoted = [
    0, // recruta
    0, // soldado
	0, // cabo
	0, // sargento
    1, // subtenente
    1, // aspirante a oficial
	1, // tenente
    1, // capitão
    1, // major
    1, // coronel
    1, // general
    1, // comandante
    1, // comandante-geral
	1, // conselheiro
    0 // supremo
];

const courses: Prisma.CourseCreateInput[] = [
    {
		acronym: "CFPM",
        name: "Curso de Formação Policial Militar ",
		document:
            "https://docs.google.com/document/d/e/2PACX-1vTVswuqjNF2Ks7XSAa5v3LDxU21tbh4pOaRaJfuswW1MEfxqe-TaGkDcSyKTQR216KC_oA10jujDxnI/pub?embedded=true",
		departament: "INS",
		powerNeeded: 1
    },
    {
        acronym: "COrt",
		name: "Curso de Ortogafia",
		document:
            "https://docs.google.com/document/d/e/2PACX-1vTGWJy-83J6ESzTs9moClurbJNiT69hNgmPMXdmETPy9FHljfYnv-azStulOOxK3tqRNy1gAuHHLBjc/pub?embedded=true",
        departament: "INS",
        powerNeeded: 1
	},
    {
        acronym: "CPP",
        name: "Curso de Planejamento Policial",
		document:
            "https://docs.google.com/document/d/e/2PACX-1vS1WE09vWm3WErs27BijSFX3phCjeipAhqcUa6h_XpTYQeXZ3K-nYvsZiiqaoZSVTedVk0AQe5WCkil/pub?embedded=true",
		departament: "INS",
        powerNeeded: 1
	},
    {
        acronym: "ECb",
        name: "Especialização de Cabos",
		document:
            "https://docs.google.com/document/d/e/2PACX-1vSv656_powpvdRofOEvnOzromSGwByOlv539vSTmkym3abFQkVxEqmgfa2EOhrCMF8FsVxRVGg1NDit/pub?embedded=true",
		departament: "ESP",
		powerNeeded: 1
    },
    {
        acronym: "ESgt",
        name: "Especialização de Sargentos",
		document:
            "https://docs.google.com/document/d/e/2PACX-1vQoHJcY_NZ0neL2JgrXzuR9HhyFpiniMuwiGF6TBJts3zKqgN79hVg5jk-FIXvwJtNiCM4OCUG80FTW/pub?embedded=true",
		departament: "ESP",
        powerNeeded: 1
	},
	{
        acronym: "ESbt",
        name: "Especialização de Subtenentes",
		document:
            "https://docs.google.com/document/d/e/2PACX-1vTb3TjSuNUjJD90HMjiQkEiaU_JUvLJQXzFv6c4k5ecgqV4ZnfLJiaI9vqexPY4EyBEZxMdWY0zLve-/pub?embedded=true",
        departament: "ESP",
		powerNeeded: 1
	},
	{
        acronym: "CFO",
		name: "Curso de Formação de Oficiais",
        document:
            "https://docs.google.com/document/d/e/2PACX-1vQbaL553kxfgCRgdkHoSl7yXnhViQOwjXoCfodmZzHMV-PbPATRaHI40eUcXXUc1mlvsGdak_V_H8PZ/pub?embedded=true",
		departament: "CDO",
        powerNeeded: 1
	},
    {
        acronym: "CFPE",
        name: "Curso de Formação Policial Executiva",
		document:
            "https://docs.google.com/document/d/e/2PACX-1vTABOjnyEWZp2PULIL9IbaNI89hjRjC7RzKeGf6OKfXS3fEmr4075gqaasbsOTUOihfwCzwAUtFwMY8/pub?embedded=true",
		departament: "EFEX",
		powerNeeded: 1
    },
    {
        acronym: "CApEx",
		name: "Curso de Aperfeiçoamento Executivo",
		document:
            "https://docs.google.com/document/d/e/2PACX-1vTQVhKQulkUlqluzR20_iq6XM8ybDPkerR7p0SRkwJ1xQURI6TYdiTSkvnwGdCAhVwnItgDsL2yqXab/pub?embedded=true",
		departament: "EFEX",
		powerNeeded: 1
    },
    {
        acronym: "CFC",
        name: "Curso de Formação Complementar",
		document:
            "https://docs.google.com/document/d/e/2PACX-1vQTRpeXBumwE7pEPjuBg_MlpabNXR6aHpP7kJvYCj8xETfgx5nqa07A_R0bsgQPTjzDEc7r1nkvgWn7/pub?embedded=true",
		departament: "EFEX",
        powerNeeded: 1
	}
];

const departamentRoles: Prisma.DepartamentRoleCreateInput[] = [
    // INS
	{
        acronym: "INS",
		name: "Instrutor",
        departament: "INS",
		powerLevel: 1
    },
    {
        acronym: "C.INS",
        name: "Coordenador dos Instrutores",
		departament: "INS",
        powerLevel: 10
	},
    {
        acronym: "AL.INS",
        name: "Auxiliar da Liderança dos Instrutores",
        departament: "INS",
		powerLevel: 11
	},
	{
        acronym: "VL.INS",
        name: "Vice Lider dos Instrutores",
		departament: "INS",
        powerLevel: 12
    },
	{
		acronym: "L.INS",
        name: "Lider dos Instrutores",
        departament: "INS",
		powerLevel: 13
    },

    // ESP
    {
        acronym: "ESP",
        name: "Especializador",
		departament: "ESP",
		powerLevel: 1
    },
	{
        acronym: "C.ESP",
        name: "Coordenador dos Especializadores",
		departament: "ESP",
        powerLevel: 10
	},
	{
        acronym: "AL.ESP",
        name: "Auxiliar da Liderança dos Especializadores",
		departament: "ESP",
		powerLevel: 11
    },
	{
        acronym: "VL.ESP",
        name: "Vice Lider dos Especializadores",
        departament: "ESP",
		powerLevel: 12
    },
    {
        acronym: "L.ESP",
        name: "Lider dos Especializadores",
        departament: "ESP",
		powerLevel: 13
    },

    // EFEX
	{
        acronym: "EFEX",
        name: "Instrutor-Executivo",
        departament: "EFEX",
		powerLevel: 1
    },
    {
        acronym: "C.EFEX",
		name: "Coordenador dos Instrutores-Executivos",
        departament: "EFEX",
		powerLevel: 10
	},
    {
        acronym: "AL.EFEX",
        name: "Auxiliar da Liderança dos Instrutores-Executivos",
		departament: "EFEX",
		powerLevel: 11
    },
	{
        acronym: "VL.EFEX",
        name: "Vice Lider dos Instrutores-Executivos",
        departament: "EFEX",
		powerLevel: 12
    },
    {
        acronym: "L.EFEX",
        name: "Lider dos Instrutores-Executivos",
        departament: "EFEX",
		powerLevel: 13
	},

    // CDO
	{
        acronym: "CDO",
        name: "Professor do Centro de Desenvolvimento de Oficiais",
		departament: "CDO",
		powerLevel: 1
	},
	{
        acronym: "C.CDO",
        name: "Coordenador do Centro de Desenvolvimento de Oficiais",
		departament: "CDO",
        powerLevel: 10
	},
	{
        acronym: "AL.CDO",
		name: "Auxiliar da Liderança do Centro de Desenvolvimento de Oficiais",
        departament: "CDO",
		powerLevel: 11
    },
    {
        acronym: "VL.CDO",
        name: "Vice Lider do Centro de Desenvolvimento de Oficiais",
		departament: "CDO",
		powerLevel: 12
	},
    {
        acronym: "L.CDO",
        name: "Lider do Centro de Desenvolvimento de Oficiais",
		departament: "CDO",
		powerLevel: 13
    },

    // RH
	{
        acronym: "RH",
		name: "Membro de Recursos Humanos",
        departament: "RH",
		powerLevel: 1
	},
    {
        acronym: "C.RH",
        name: "Coordenador de Recursos Humanos",
        departament: "RH",
		powerLevel: 10
    },
	{
        acronym: "AL.RH",
        name: "Auxiliar da Liderança do Recursos Humanos",
		departament: "RH",
		powerLevel: 11
    },
    {
        acronym: "VL.RH",
        name: "Vice Lider de Recursos Humanos",
		departament: "RH",
        powerLevel: 12
    },
	{
		acronym: "L.RH",
        name: "Lider de Recursos Humanos",
        departament: "RH",
		powerLevel: 13
    },

    // MKT
    {
        acronym: "MKT",
        name: "Membro do Departamento de Marketing",
		departament: "MKT",
		powerLevel: 1
    },
	{
        acronym: "C.MKT",
        name: "Coordenador do Departamento de Marketing",
		departament: "MKT",
        powerLevel: 10
	},
	{
        acronym: "AL.MKT",
        name: "Auxiliar do Departamento de Marketing",
		departament: "MKT",
        powerLevel: 11
    },
    {
		acronym: "VL.MKT",
        name: "Vice Lider do Departamento de Marketing",
        departament: "MKT",
		powerLevel: 12
    },
    {
        acronym: "L.MKT",
        name: "Lider do Departamento de Marketing",
        departament: "MKT",
		powerLevel: 13
    },

    // MKT
	{
        acronym: "PTR",
        name: "Patrulheiro",
		departament: "PTR",
        powerLevel: 1
    },
	{
		acronym: "C.PTR",
        name: "Coordenador da Patrulha",
        departament: "PTR",
        powerLevel: 10
	},
    {
        acronym: "AL.PTR",
        name: "Auxiliar da Patrulha",
		departament: "PTR",
		powerLevel: 11
    },
    {
        acronym: "VL.PTR",
        name: "Vice Lider da Patrulha",
        departament: "PTR",
		powerLevel: 12
    },
    {
        acronym: "L.PTR",
		name: "Lider da Patrulha",
        departament: "PTR",
		powerLevel: 13
    },

    // CDT
	{
        acronym: "CDT",
        name: "Membro do Centro de Desenvolvimento Tecnológico",
        departament: "CDT",
		powerLevel: 1
    },
    {
        acronym: "C.CDT",
		name: "Coordenador do Centro de Desenvolvimento Tecnológico",
		departament: "CDT",
        powerLevel: 10
	},
	{
        acronym: "AL.CDT",
        name: "Auxiliar do Centro de Desenvolvimento Tecnológico",
        departament: "CDT",
		powerLevel: 11
    },
    {
        acronym: "VL.CDT",
		name: "Vice Lider do Centro de Desenvolvimento Tecnológico",
		departament: "CDT",
		powerLevel: 12
    },
    {
		acronym: "L.CDT",
        name: "Lider do Centro de Desenvolvimento Tecnológico",
		departament: "CDT",
		powerLevel: 13
	}
];

const permissionsRequired = [
  {
    action: "BE_PROMOTED",
    name: "ECb",
    type: "COURSE",
    roleName: "Cabo"
  },
  {
    action: "BE_PROMOTED",
    name: "ESgt",
    type: "COURSE",
    roleName: "Sargento"
  },
  {
    action: "PROMOTE",
    name: "ESbt",
    type: "COURSE",
    roleName: "Subtenente"
  },
  {
    action: "BE_PROMOTED",
    name: "ESbt",
    type: "COURSE",
    roleName: "Subtenente"
  },
  {
    action: "BE_PROMOTED",
    name: "CFO",
    type: "COURSE",
    roleName: "Aspirante a Oficial"
  },
  {
    action: "PROMOTE",
    name: "CFO",
    type: "OTHER",
    roleName: "Aspirante a Oficial",
    hierarchyKind: "EXECUTIVE"
  },
  {
    action: "DEMOTE",
    name: "CFO",
    type: "OTHER",
    roleName: "Aspirante a Oficial",
    hierarchyKind: "EXECUTIVE"
  },
  {
    action: "WARN",
    name: "CFO",
    type: "OTHER",
    roleName: "Aspirante a Oficial",
    hierarchyKind: "EXECUIVE"
  }
]

const prisma = new PrismaClient();

async function main() {
    const roles = [];
	militaryNames.forEach((role, index) => {
        const roleObject = {
			name: role,
            hierarchyKind: "MILITARY",
            hierarchyPosition: index,
            promotesUntilRolePosition: promotionRange[index],
			demoteUntilRolePosition: index <= 4 ? 0 : index - 1,
			fireUntilRolePosition: index <= 5 ? 0 : index - 1,
            gratifyUntilRolePosition: index <= 4 ? 0 : index - 1,
			daysToBePromoted: daysToBePromoted[index]
		};
		roles.push(roleObject);
	});
    executiveNames.forEach((role, index) => {
		const idx = index + 2;
        const roleObject = {
			name: role,
            hierarchyKind: "EXECUTIVE",
			hierarchyPosition: idx,
            promotesUntilRolePosition: promotionRange[idx],
			demoteUntilRolePosition: idx <= 4 ? 0 : idx - 1,
			fireUntilRolePosition: idx <= 5 ? 0 : idx - 1,
			gratifyUntilRolePosition: idx <= 4 ? 0 : idx - 1,
			daysToBePromoted: daysToBePromoted[idx]
		};
		roles.push(roleObject);
	});
	try {
        await prisma.roles.createMany({
            data: roles
		});
		console.log("Cargos criados.");
	} catch {
		console.log("Não foi possível criar os cargos.");
	}

    try {
        await prisma.user.createMany({
            data: adminUsers
		});
		console.log("Usuários administradores criados");
	} catch {
		console.log("Não foi possível criar os usuários.");
	}

    try {
        await prisma.departamentRole.createMany({
			data: departamentRoles
		});
		console.log("Cargos de departamentos criados.");
	} catch {
		console.log("Não foi possível criar os cargos de departamento.");
	}

    try {
		await prisma.course.createMany({
			data: courses
        });
        console.log("Cursos criados.");
    } catch {
		console.log("Não foi possível criar os cursos.");
	}
}

main().finally(async () => await prisma.$disconnect());
