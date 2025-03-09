# readwise-new-highlights-email

Send yourself a weekly email with your most recent Readwise highlights

Fork this repository and then you will need to set up 4 repository secrets

```env
SENDER_EMAIL // your gmail address
EMAIL_PASSWORD // you gmail app password
RECIPIENT_EMAILS // list of who should receive the emails
READWISE_API_KEY // your readwise API key
```

To run locally

1. Set environment variables in `.env` file
2. `yarn install`
3. `node ./export.js`
