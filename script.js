const cron = require('node-cron');
const nodemailer = require('nodemailer');

const { getHTML, getLinks, getParsedPageData } = require('./scraper');

const mainLink = 'https://www.aruodas.lt/butai/vilniuje/?FOrder=AddDate&FQuartal=1%2C12%2C16%2C18%2C24';
const dbData = [];

const getPaginationLink = page => `https://www.aruodas.lt/butai/vilniuje/puslapis/${page}/?FOrder=AddDate&FQuartal=1%2C12%2C16%2C18%2C24`;

const calcDate = int => int < 10 ? `0${int}` : int;

const getDate = () => {
	const date = new Date();
	const year = date.getFullYear();
	const month = calcDate(date.getMonth() + 1);
	const day = calcDate(date.getDate());
	const hours = calcDate(date.getHours());
	const minutes = calcDate(date.getMinutes());
	return `${year}/${month}/${day}-${hours}:${minutes}`;
}

const generateEmailBody = data => {
	const dataTitles = ['url', 'Kaina', 'Kaina už kvadratą', 'Rajonas', 'Gatve', 'Dydis', 'Plotas', 'Metai', 'Papildomos patalpos'];
	let html = '<html><body>';
	let header = '';
	dataTitles.forEach(title => {
		header += `<th style="border: 1px solid black;border-collapse:collapse;table-layout:fixed;padding:5px;text-align:left;width:100px;">${title}</th>`
	})
	header = '<tr>' + header + '</tr>';
	data.forEach(item => {
		let table = '<table style="width:100%;table-layout:fixed;border:1px solid black;border-collapse:collapse;">';
		let tableData = '';
		dataTitles.forEach(title => {
			let dataRow = title === 'url' ? `<a href='${item[title]}'>link<a/>` : item[title];
			tableData += `<td style="border: 1px solid black;border-collapse:collapse;table-layout:fixed;padding:5px;text-align:left;width:100px;">${dataRow || 'Nenurodyta'}</td>`;
		})
		table += header + '<tr>' + tableData + '</tr>';
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
			user: 'mailas@kazkoks.lt',
			pass: 'slaptazodis'
		},
		debug: false,
		logger: true
	});

	const mailOptions = {
		from: 'mailas@kazkoks.lt',
		to: 'julius.liubertas@gmail.com, kitas@emailas.lt',
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
	main();
});
