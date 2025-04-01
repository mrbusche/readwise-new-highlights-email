require('dotenv').config();
const nodemailer = require('nodemailer');

const readwiseToken = process.env.READWISE_API_KEY;
const senderEmail = process.env.SENDER_EMAIL;
const emailPassword = process.env.EMAIL_PASSWORD;
const recipientEmails = process.env.RECIPIENT_EMAILS;

const fetchFromExportApi = async (updatedAfter = null) => {
  const queryParams = new URLSearchParams();
  queryParams.append('updatedAfter', updatedAfter);
  console.log('Making export api request with params ' + queryParams.toString());
  const response = await fetch('https://readwise.io/api/v2/export/?' + queryParams.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Token ${readwiseToken}`,
    },
  });
  const responseJson = await response.json();
  return responseJson['results'];
};

const generateHtml = async () => {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const data = await fetchFromExportApi(oneWeekAgo.toISOString());

  const isMyHighlight = (highlight, threshold) => highlight.highlighted_at && Date.parse(highlight.highlighted_at) >= threshold;

  const filteredData = data
    .map((book) => ({
      ...book,
      highlights: book.highlights.filter((highlight) => isMyHighlight(highlight, oneWeekAgo)),
    }))
    .filter((book) => book.highlights.length > 0);

  const htmlParts = [];
  htmlParts.push(htmlHeader);
  filteredData.forEach((book) => htmlParts.push(renderBook(book)));
  htmlParts.push(htmlFooter);

  return htmlParts.join('');
};

const sendEmail = async () => {
  const html = await generateHtml();

  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: senderEmail,
      pass: emailPassword,
    },
  });

  let mailOptions = {
    from: senderEmail,
    to: recipientEmails,
    subject: 'Weekly Readwise Export',
    html: html,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.error('Error sending email:', error);
    }
    console.log('Email sent successfully:', info.response);
  });
};

const htmlHeader = `<!DOCTYPE html>
    <html>
      <head>
        <title>Books and Highlights</title>
        <style>
          .book {
            border: 1px solid #ccc;
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 4px;
            display: flex;
            flex-wrap: wrap;
          }
          .left-column {
            flex: 0 0 200px;
            margin-right: 15px;
          }
          .left-column img {
            max-width: 100%;
            height: auto;
            display: block;
          }
          .right-column {
            flex: 1;
          }
          .highlights {
            margin-top: 10px;
          }
          .highlights ul {
            list-style-type: disc;
            padding-left: 20px;
          }
          .highlights li {
            margin-bottom: 10px;
          }
        </style>
      </head>
      <body>`;

const renderBook = (book) => `
      <div class="book">
        <div class="left-column">
          <img src="${book.cover_image_url}" alt="${book.readable_title} cover">
        </div>
        <div class="right-column">
          <h2>${book.readable_title}</h2>
          <p><strong>Author:</strong> ${book.author}</p>
          <div class="highlights">
            <h3>Highlights:</h3>
            <ul>
              ${book.highlights.map(renderHighlight).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;

const renderHighlight = (highlight) => `
    <li>
      <p><strong>Text:</strong> ${highlight.text}</p>
      ${highlight.note.length ? `<p><strong>Note:</strong> ${highlight.note}</p>` : ''}
      <p>
        <strong>Readwise URL:</strong>
        <a href="${highlight.readwise_url}">${highlight.readwise_url}</a>
      </p>
    </li>
  `;

const htmlFooter = `</body></html>`;

sendEmail();
