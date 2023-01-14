const request = require('request')

const getGameName = (game_id, client_id, server_auth) => {
    const gameOptions = {
        url: `https://api.twitch.tv/helix/games?id=${game_id}`,
        method: 'GET',
        headers: {
            'Client-ID': client_id,
            'Authorization': `Bearer ${server_auth}`
        }
    }

    request(gameOptions, async(error, { body }) => {
        body = JSON.parse(body)
        console.log('game', { game_id, client_id, server_auth, body, error })
        if (body.data.length > 0) {
            console.log('here', { name: body.data[0].name })
            return body.data[0].name
        } else
            return undefined
    })
}

const delay = async(ms) => {
    return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = { getGameName, delay }