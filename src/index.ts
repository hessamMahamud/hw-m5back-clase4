import { Octokit } from "@octokit/rest"
import * as dotenv from "dotenv"

dotenv.config();

const token = process.env.GITHUB_TOKEN;

if (!token) {
    console.error("Error: GITHUB_TOKEN no está configurado en .env");
    process.exit(1);
}

const octokit = new Octokit({ auth: token });

async function main() {
    const { data: user } = await octokit.rest.users.getAuthenticated();
    console.log(`Conectado como: ${user.login}`);
    console.log(`Nombre: ${user.name}`);
    console.log(`Repos públicos: ${user.public_repos}`);

    await listRepos();
    await getRepo("hessamMahamud", "ProyectoM5_HessamMahamud");
    await createIssue("hessamMahamud", "ProyectoM5_HessamMahamud", "Test desde Octokit", "Este issue fue creado desde mi homework de Octokit.");
}

async function listRepos() {
    const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser({
        per_page: 10,
        sort: "updated"
    });

    console.log(`\nTus últimos ${repos.length} repositorios`);
    repos.forEach(repo => {
        console.log(`- ${repo.name} (${repo.private ? "privado" : "público"})`);
    });
}

async function getRepo(owner: string, repo: string) {
    try {
        const { data } = await octokit.rest.repos.get({ owner, repo});
        console.log(`\nRepositorios: ${data.full_name}`);
        console.log(`Descripción: ${data.description}`);
        console.log(`Branch principal: ${data.default_branch}`);   
    } catch (error: any) {
        if (error.status === 404) {
            console.error(`Error: el repositorio "${owner}/${repo}" no existe o no tienes acceso.`);
        } else if (error.status === 401) {
            console.error("Error: token inválido o expirado. Verificar GITHUB_TOKEN en .env");
        } else {
            console.error(`Error inesperado (${error.status}): ${error.message}`);
        };
    };
};

async function checkRateLimit() {
    const { data } = await octokit.rest.rateLimit.get();
    const core = data.resources.core;
    const resetDate = new Date(core.reset * 1000).toLocaleTimeString();

    console.log(`\nRate limit:`);
    console.log(`   Límite: ${core.limit} request/hora`);
    console.log(`   Restantes: ${core.remaining}`);
    console.log(`   Se resetea a las: ${resetDate}`);
}

async function createIssue(owner: string, repo: string, title: string, body: string) {
    try {
        const { data } = await octokit.rest.issues.create({
            owner,
            repo,
            title,
            body
        });

        console.log(`\nIssue creado: ${data.html_url}`);
    } catch (error: any) {
        if (error.status === 403) {
            console.error("Error: no tienes permisos para crear issues en este repositorio")
        } else if (error.status === 422) {
            console.error(`Error de validación: verificar que el título no esté vacío y que el repo tenga issues habilitados.`);
        } else {
            console.error(`Error (${error.status}): ${error.message}`);
        };
    };
};

main();
checkRateLimit();
