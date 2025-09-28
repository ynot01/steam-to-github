import { Octokit, RequestError } from "octokit"
import SmeeClient from 'smee-client'
import NodeRSA from 'node-rsa'
import { scryptSync, createDecipheriv } from 'node:crypto'
import * as fs from 'fs'
import http from 'http'
import https from 'https'
import * as GitHubApp from './comments_schema.ts'
import dotenv from 'dotenv'

dotenv.config()

var RSAkey = new NodeRSA(
    fs.readFileSync('id_rsa.key','utf8'), 'pkcs1-private-pem'
)
RSAkey.setOptions({
    environment:"browser",
    encryptionScheme: 'pkcs1'
})

const repoOwner = process.env.REPO_OWNER || ""
if (repoOwner == "") {
    throw "REPO_OWNER env variable not set!"
}
const repoName = process.env.REPO_NAME || ""
if (repoName == "") {
    throw "REPO_NAME env variable not set!"
}
const identity = process.env.WEBAPI_IDENTITY || ""
if (identity == "") {
    throw "WEBAPI_IDENTITY env variable not set!"
}
const devKey = process.env.DEVELOPER_WEBAPI_KEY || ""
if (devKey == "") {
    throw "DEVELOPER_WEBAPI_KEY env variable not set!"
}
const appID = process.env.STEAM_APPID || ""
if (appID == "") {
    throw "STEAM_APPID env variable not set!"
}
const authToken = process.env.GITHUB_ISSUE_AUTH_TOKEN || ""
if (authToken == "") {
    throw "GITHUB_ISSUE_AUTH_TOKEN env variable not set!"
}
const smeeLink = process.env.SMEE_LINK || ""
if (smeeLink == "") {
    throw "SMEE_LINK env variable not set!"
}

type banListType = {
    banned: string[]
}
if (!fs.existsSync("banlist.json")) {
    fs.writeFileSync("banlist.json", JSON.stringify({banned:["0", "1", "2"]}))
}
var banList:banListType = JSON.parse(fs.readFileSync("banlist.json",'utf8'))

type readIssueIDsType = {
    readed: number[]
}
if (!fs.existsSync("readids.json")) {
    fs.writeFileSync("readids.json", JSON.stringify({readed:[0,1,2]}))
}
var readIssueIDs:readIssueIDsType = JSON.parse(fs.readFileSync("readids.json",'utf8'))

// "TOKEN" = Date.now()
var tokenRecent: { [id: string] : number; } = {}
var tokenExpires: number = (1000 * 60 * 60) // 1 hour

const typeCast = {
    "bug":"bug",
    "suggestion":"enhancement",
    "hardware survey":"documentation"
}

const smee = new SmeeClient({
  source: smeeLink,
  target: 'http://localhost:16251',
  logger: console
})
// dummy http server is only here to suppress SmeeClient redirect
http.createServer(function (req, res) {
  res.writeHead(200);
  res.end();
}).listen(16251);

const events = await smee.start()

events.onerror = (ev) => {
    try {
        console.log(ev.message)
    } catch (err)
    {
        console.log(err)
    }
}
events.onmessage = (ev) => {
    try {
        const aesKey:Buffer = RSAkey.decrypt(Buffer.from(JSON.parse(ev.data).body.pw, "base64"), "buffer")
        const aesIV:Buffer = RSAkey.decrypt(Buffer.from(JSON.parse(ev.data).body.iv, "base64"), "buffer")
        let decipher = createDecipheriv('aes-256-cbc', aesKey, aesIV)
        decipher.setAutoPadding(false)
        const titleIssue:string = decipher.update(JSON.parse(ev.data).body.title, 'base64', 'utf8').trim().replace(/\0/g, '')
        decipher.final()
        console.log(titleIssue)
        decipher = createDecipheriv('aes-256-cbc', aesKey, aesIV)
        decipher.setAutoPadding(false)
        const descIssue:string = decipher.update(JSON.parse(ev.data).body.description, 'base64', 'utf8').trim().replace(/\0/g, '')
        decipher.final()
        console.log(descIssue)
        decipher = createDecipheriv('aes-256-cbc', aesKey, aesIV)
        decipher.setAutoPadding(false)
        const steamToken:string = decipher.update(JSON.parse(ev.data).body.steamtoken, 'base64', 'utf8').trim().replace(/\0/g, '')
        decipher.final()
        console.log(steamToken)
        decipher = createDecipheriv('aes-256-cbc', aesKey, aesIV)
        decipher.setAutoPadding(false)
        const typeIssue:string = decipher.update(JSON.parse(ev.data).body.type, 'base64', 'utf8').trim().replace(/\0/g, '')
        decipher.final()
        console.log(typeIssue)
        decipher = createDecipheriv('aes-256-cbc', aesKey, aesIV)
        decipher.setAutoPadding(false)
        const uuid:string = decipher.update(JSON.parse(ev.data).body.uuid, 'base64', 'utf8').trim().replace(/\0/g, '')
        decipher.final()
        console.log(uuid)
        // uuidv4 validator
        // https://stackoverflow.com/a/13653180
        // https://creativecommons.org/licenses/by-sa/4.0/
        if (!(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(uuid))) {
            console.log("Invalid UUID provided")
            return
        }
        if (Object.prototype.hasOwnProperty.call(tokenRecent, steamToken)) { // A token should not be used twice!
            return
        }
        // After use, it should be invalidated by the client (in about 5 seconds at most), so we can free it from memory later
        tokenRecent[steamToken] = Date.now() + tokenExpires
        const urlGet = // https://partner.steamgames.com/doc/webapi/ISteamUserAuth
            "https://partner.steam-api.com/ISteamUserAuth/AuthenticateUserTicket/v1/"+
            "?key="+devKey+
            "&appid="+appID+
            "&ticket="+steamToken+
            "&identity="+identity
        console.log(`${typeIssue} - ${titleIssue} - ${descIssue}`)
        https.get(urlGet, (res) => {
            res.on('data', (htdata:Buffer) => {
                try {
                    const body = JSON.parse(htdata.toString())
                    const params = body.response.params
                    if (params.vacbanned || params.publisherbanned) {
                        return
                    }
                    var bannedList:Array<string> = banList.banned
                    if ( (bannedList.indexOf(params.ownersteamid) > -1) || (bannedList.indexOf(params.steamid) > -1) ) {
                        return
                    }
                    postIssue(titleIssue, descIssue, params.ownersteamid, params.steamid, typeIssue, uuid)
                } catch (err)
                {
                    console.log(err)
                }
            })
        })
    } catch (err)
    {
        console.log(err)
    }
}

const octokit = new Octokit({
  auth: authToken
})

async function refreshBanList() {
    var currentTimeMillis = Date.now()
    for (const token in tokenRecent) {
        if (currentTimeMillis > tokenRecent[token]) {
            delete tokenRecent[token]
        }
    }
    try {
        var resp = await octokit.request(`GET /repos/${repoOwner}/${repoName}/issues/comments`, {
            owner: repoOwner,
            repo: repoName,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        })
        var data:GitHubApp.MySchema = resp.data
        for(const comment of data) {
            if (readIssueIDs.readed.indexOf(comment.id) > -1) {
                continue
            }
            if (comment.body?.startsWith("!ban")) {
                var banId = comment.body.slice(5)
                if (Number.isNaN(Number(banId)) || Number(banId) == 0) {
                    continue
                }
                var bannedList:Array<string> = banList.banned
                if (bannedList.indexOf(banId.trim()) > -1) {
                    continue
                }
                bannedList.push(banId.trim())
                banList.banned = bannedList
                fs.writeFileSync("banlist.json", JSON.stringify(banList))
            } else if (comment.body?.startsWith("!unban")) {
                var banId = comment.body.slice(5)
                if (Number.isNaN(Number(banId)) || Number(banId) == 0) {
                    continue
                }
                var bannedList:Array<string> = banList.banned
                var banIndex = bannedList.indexOf(banId.trim())
                if (banIndex > -1) {
                    bannedList.splice(banIndex, 1)
                }
                banList.banned = bannedList
                fs.writeFileSync("banlist.json", JSON.stringify(banList))
            }
            
            var readedList:Array<number> = readIssueIDs.readed
            readedList.push(comment.id)
            readIssueIDs.readed = readedList
            fs.writeFileSync("readids.json", JSON.stringify(readIssueIDs))
        }
    } catch (err)
    {
        console.log(err)
    }
}
setInterval(refreshBanList, 20000);

async function postIssue(title:string, description:string, ownersteamid:string, steamid:string, type:string, uuid:string): Promise<void> {
    if (title == "" || description == "" || type == "") { return }
    var issueBody = `
Owner: https://steamcommunity.com/profiles/${ownersteamid}

Poster: https://steamcommunity.com/profiles/${steamid}

Use \`!ban <steamid64>\` in these comments to ban a user from creating issues

Use \`!unban <steamid64>\` to unban a steamid

## Description

${description}
`
    var label:string = typeCast[type as keyof typeof typeCast]
    if (label == null || label == "") { return }
    try {
        await octokit.request(`POST /repos/${repoOwner}/${repoName}/issues`, {
            owner: repoOwner,
            repo: repoName,
            title: title,
            body: issueBody,
            labels: [
                label
            ],
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        })
        var postMsg = JSON.stringify({
            "success": uuid
        })
        var postReq = https.request({
            hostname: "smee.io",
            port: 443,
            path: '/'+smeeLink.match(/(?<=https:\/\/smee.io\/).*/)?.toString(),
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postMsg.length
            }
        }, (_) => {

        })
        postReq.write(postMsg)
        postReq.end()
    } catch (error) {
        if (error instanceof RequestError) {
            console.log(error.message)
        } else {
            throw error
        }
    }
}
