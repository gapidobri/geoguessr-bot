const geo = require('./geoguessr.js')
const { Client, MessageAttachment, MessageEmbed } = require('discord.js')
require('dotenv').config()

const client = new Client()
let players = []
let gameState = 'stopped', url, fetchInterval

client.on('ready', () => {
    console.log(`Connected as ${client.user.tag}`)

    client.guilds.cache.forEach(guild => {
        console.log(guild.name)
    })

    client.user.setActivity('gg!battle', {
        type: 'PLAYING',
    })

})

const diff = (oldArr, newArr) => {
    return newArr.filter(i => !oldArr.includes(i))
}

const updateActivity = () => {
    let content
    switch (gameState) {
        case 'loading': 
            content = 'Creating game'
            break
        case 'loaded':
            content = 'gg!start'
            break
        case 'starting':
            content = 'Game starting'
            break
        case 'started':
            content = 'Battle Royale'
            break
        default:
            content = 'gg!battle'
    }
    client.user.setActivity(content, {
        type: 'PLAYING',
    })
}

const stopGame = async () => {
    if (fetchInterval) {
        fetchInterval.close()
    }
    await geo.stop()
    gameState = 'stopped'
    updateActivity()
    players = []
    url = null
    fetchInterval = null
}

client.on('message', async message => {
    const { content = content.trim() } = message
    const [cmd, ...args] = content.split(' ')
    
    if (!cmd.startsWith('gg!')) return
    if (message.author.id === client.user.id) return

    const cmdName = cmd.replace('gg!', '')

    switch (cmdName) {
        case 'battle':
            gameState = 'loading'
            updateActivity()
            message.channel.send('**Creating a new battle royale game** 🌍')
            url = await geo.battleRoyale()

            gameState = 'loaded'
            updateActivity()
            message.channel.send(
                `**Join here:** ${url}\n` +
                'Run `gg!start` to start the game'
            )

            fetchInterval = setInterval(async () => {

                const playerList = await geo.playerList()
                let change = false

                const newPlayers = diff(players, playerList)
                if (newPlayers.length) {
                    change = true
                    if (playerList.length > 1)
                    newPlayers.forEach(player => {
                        message.channel.send(`**${player}** joined. *${playerList.length}/10*`)
                    })
                }

                const playersLeft = diff(playerList, players)
                if (playersLeft.length) {
                    change = true
                    playersLeft.forEach(player => {
                        message.channel.send(`**${player}** left. *${playerList.length}/10*`)
                    })

                    if (playerList.length === 1) {
                        message.channel.send('**All players left**, Stopping the game 💣')
                        await stopGame()
                    }
                }

                players = playerList

                if (change) {
                    await client.user.setActivity(`${playerList.length}/10 players`, {
                        type: 'WATCHING',
                    })
                    change = false
                }


            }, 1000)
            break
        
        case 'start':
            switch (gameState) {
                case 'stopped':
                    message.channel.send('**No game is running** ❗\nRun `gg!battle`')
                    break

                case 'loading':
                    message.channel.send('**Your game is still loading** ⏲️')
                    break
                
                case 'loaded':
                    gameState = 'starting'
                    updateActivity()
                    await geo.start()
                    gameState = 'started'
                    updateActivity()
                    message.channel.send('**Game started** ✅')
                    break
            }
            break
        
        case 'end':
        case 'stop':
            if (gameState === 'stopped') {
                message.channel.send('**No game is running** ❗\nRun `gg!battle`')
            } else {
                stopGame()
                message.channel.send('**Game stopped 💣**')
            }
            break
        
        case 'url':
            if (url) {
                message.channel.send(`Current game: ${url}`)
            } else {
                message.channel.send('**No game is running** ❗\nRun `gg!battle`')
            }
            break
        
        case 'list':
            if (gameState === 'stopped') {
                message.channel.send('**No game is running** ❗\nRun `gg!battle`')
            } else {
                const listEmbed = new MessageEmbed()
                    .addField(`Players ${players.length}/10`, players.join('\n'))
                message.channel.send(listEmbed)
            }
            break
        
        case 'help':
            const helpEmbed = new MessageEmbed()
                .setTitle('Geoguessr bot help')
                .addField('`gg!battle`', 'Create a new game')
                .addField('`gg!start`', 'Start the game')
                .addField('`gg!end`', 'Stop the game')
                .addField('`gg!list`', 'List players')
                .addField('`gg!url`', 'Get game url')
                .addField('`gg!help`', 'Show help')
            message.channel.send(helpEmbed)
            break
        
        default:
            message.channel.send('❓ This command does not exist. Run `gg!help` for list of commands')
    }
})

client.login(process.env.TOKEN)