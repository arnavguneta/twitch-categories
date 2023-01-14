const path = require('path')
const express = require('express')
const hbs = require('hbs')
const request = require('request')
const nodemailer = require('nodemailer')
const email_content = require('./utils/email_format')

const app = express()
const port = process.env.PORT || 3000

// paths for express config
const publicPath = path.join(__dirname, '../public')
const viewsPath = path.join(__dirname, '../templates/views')
const partialsPath = path.join(__dirname, '../templates/partials')

// handlebars setup
app.set('view engine', 'hbs')
app.set('views', viewsPath)
hbs.registerPartials(partialsPath)

// setup static dir to serve
app.use(express.json())
app.use(express.static(publicPath))

const client_id = process.env.CLIENT_ID
const client_secret = process.env.CLIENT_SECRET
let auth_code = ''
let server_auth = ''

app.get('', (req, res) => {
    res.redirect(`https://id.twitch.tv/oauth2/authorize?client_id=${client_id}&redirect_uri=http://localhost:3000/auth/&response_type=code`)
})

app.get('/category', (req, res) => {
    res.render('category', {
        title: 'Category Change Notifier',
        name: 'Arnav Guneta'
    })
})

app.post('/category/process_request', (req, res) => {
    const streamerOptions = {
        url: `https://api.twitch.tv/helix/search/channels?query=${req.body.username}`,
        method: 'GET',
        headers: {
            'Client-ID': client_id,
            'Authorization': `Bearer ${server_auth}`
        }
    }
    let game_id = 'random val'
    const requestInterval = setInterval(() => {
        request(streamerOptions, (error, { body }) => {
            const user = JSON.parse(body).data[0]
            if (!game_id) {
                game_id = user.game_id
            } else if (game_id !== user.game_id) {
                let new_game
                const gameOptions = {
                    url: `https://api.twitch.tv/helix/games?id=${user.game_id}`,
                    method: 'GET',
                    headers: {
                        'Client-ID': client_id,
                        'Authorization': `Bearer ${server_auth}`
                    }
                }

                request(gameOptions, (error2, { body }) => {
                    body = JSON.parse(body)
                    console.log('game', { game_id, client_id, server_auth, body, error2 })
                    if (body.data.length > 0) {
                        new_game = body.data[0].name
                    }
                })
                console.log('games', { new_game })

                const sendEmail = setInterval(() => {
                    if (new_game) {
                        const transporter = nodemailer.createTransport({
                            service: 'gmail',
                            auth: {
                                user: 'twitchcategorychange@gmail.com',
                                pass: 'y4Lh$Z9;2=Z4gX/'
                            }
                        });

                        const mailOptions = {
                            from: 'twitchcategorychange@gmail.com',
                            to: req.body.email,
                            subject: `Streamer ${user.display_name} just switched categories!`,
                            html: email_content(user, new_game)
                        };

                        transporter.sendMail(mailOptions, (error, info) => {
                            if (error) {
                                console.log(error);
                            } else {
                                console.log('Email sent: ' + info.response);
                            }
                        });
                        clearInterval(requestInterval)
                        clearInterval(sendEmail)
                    }
                }, 100)
            }
            console.log('category', { user, error, options: streamerOptions, auth_code })
        })
    }, 2000)
})



app.get('/auth/*', (req, res) => {
    auth_code = req.query.code
    request({ url: `https://id.twitch.tv/oauth2/token?client_id=${client_id}&client_secret=${client_secret}&code=${auth_code}&grant_type=authorization_code&redirect_uri=http://localhost:3000/category`, method: 'POST' }, (error, { body }) => {
        body = JSON.parse(body)
        server_auth = body.access_token
        res.redirect('http://localhost:3000/category')
    })
})

app.get('/about', (req, res) => {
    res.render('about', {
        title: 'About Me',
        name: 'Arnav Guneta'
    })
})

app.get('/help', (req, res) => {
    res.render('help', {
        message: 'This website notifies you whenever a streamer switches categories.',
        title: 'Help',
        name: 'Arnav Guneta'
    })
})


app.get('/help/*', (req, res) => {
    res.render('404', {
        title: 'Help article not found',
        name: 'Arnav Guneta',
        message: 'The help page you were looking for was not found. Try again by going back to the help page.'
    })
})

app.get('*', (req, res) => {
    res.render('404', {
        title: 'Page not found',
        name: 'Arnav Guneta',
        message: 'The page you were looking for was not found.'
    })
})

app.listen(port, () => {
    console.log('server is up on port ' + port)
})