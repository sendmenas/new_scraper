const cron = require('node-cron');
const nodemailer = require('nodemailer');

const { getHTML, getLinks, getParsedPageData } = require('./scraper');

const mainLink = 'https://www.aruodas.lt/butai/vilniuje/?FOrder=AddDate';
const dbData = [];

const getPaginationLink = page => `https://www.aruodas.lt/butai/vilniuje/puslapis/${page}/?FOrder=AddDate`;

const calculateDate = int => int < 10 ? `0${int}` : int;

const getDate = () => {
	const date = new Date();
	const year = date.getFullYear();
	const month = calculateDate(date.getMonth() + 1);
	const day = calculateDate(date.getDate());
	const hours = calculateDate(date.getHours());
	const minutes = calculateDate(date.getMinutes());

	return `${year}/${month}/${day}-${hours}:${minutes}`;
}

const generateEmailBody = data => {
	let html = '<html><body>';
	data.forEach(item => {
		let table = '<table style="width:100%;table-layout:fixed;border:1px solid black;border-collapse:collapse;">';
		let header = '';
		let tableData = '';
		for (let key in item) {
			if (key !== 'Aprašymas') {
				header += `<th style="border: 1px solid black;border-collapse:collapse;table-layout:fixed;padding:5px;text-align:left;width:100px;">${key}</th>`
				let dataRow = key === 'url' ? `<a href='${item[key]}'>link<a/>` : item[key];
				tableData += `<td style="border: 1px solid black;border-collapse:collapse;table-layout:fixed;padding:5px;text-align:left;width:100px;">${dataRow}</td>`;
			}
		}
		table += '<tr>' + header + '</tr><tr>' + tableData + '</tr>';
		html += table + '</table><br>';
	})
	html += '</body></html>';

	return html;
};

const main = () => {
	let page = 2;
	const links = getLinks(getHTML(mainLink));
	for (let i = 0; i < links.length; i++) {
		console.log(`page 1, link ${i} of ${links.length - 1} - ${new Date()}`);
		const pageData = getParsedPageData(getHTML(links[i]), links[i]);
		dbData.push(pageData);
	}

	while (page < 4) {
		const links = getLinks(getHTML(getPaginationLink(page)));
		for (let i = 0; i < links.length; i++) {
			console.log(`page ${page}, link ${i} of ${links.length - 1} - ${new Date()}`);
			const pageData = getParsedPageData(getHTML(links[i]), links[i]);
			dbData.push(pageData);
		}
		page++;
	}
	sendEmail(generateEmailBody(dbData));
};


const sendEmail = content => {
	const transporter = nodemailer.createTransport({
		service: 'yahoo',
		secure: false,
		auth: {
			user: 'your@email.com',
			pass: 'password'
		},
		debug: false,
		logger: true
	});

	const mailOptions = {
		from: 'your@email.com',
		to: 'receiver@email.com',
		subject: `Nauji skelbimai ${getDate()}`,
		html: content
	};

	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			console.log(error);
		} else {
			console.log(`Email sent ${getDate()}: ${info.response}`);
		}
	})
}

cron.schedule('0 8 * * *', () => {
	console.log('cron started');
	main();
});
