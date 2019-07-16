const cheerio = require('cheerio');
const fs = require('fs');
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

const httpGet = url => {
	const xmlHttp = new XMLHttpRequest();
	xmlHttp.open("GET", url, false);
	xmlHttp.send(null);

	return xmlHttp.responseText;
}

const parseAddress = addressStr => {
	const addressArr = addressStr.split(',').map(item => item.replace('/\r?\n|\r/g', '').trim());
	const addressObj = {
		Miestas: addressArr[0],
		Rajonas: addressArr[1],
		Gatve: addressArr[2],
		Dydis: addressArr[3]
	};

	return addressObj;
};

const parseDetails = data => {
	const detailsObj = {}
	const tags = [];
	const details = [];

	data('.obj-details dt').each(function() {
		tags.push(data(this).text().replace(':', '').trim());
	});

	data('.obj-details dd').each(function() {
		details.push(data(this).text().replace(/\s+/g, ' ').trim());
	});

	tags.forEach((item, i) => detailsObj[item] = details[i]);

	return detailsObj;
}

const getDates = data => {
	dates = {};
	data('.obj-stats dt').each(function() {
		if (data(this).text() === 'Įdėtas') {
			dates.created = data(this).next().text();
		}
		if (data(this).text() === 'Redaguotas') {
			dates.edited = data(this).next().text();
		}
	});

	return dates;
}

exports.getLinks = html => {
	const adds = [];
	const data = cheerio.load(html);
	data('.list-adress a').each(function () {
		adds.push(data(this).prop('href'));
	});

	return adds;
}

exports.getHTML = url => {
	return httpGet(url);
};

exports.getParsedPageData = (html, url) => {
	const data = cheerio.load(html);
	const address = parseAddress(data('h1').text());
	const Kaina = data('.price-eur').text().replace(/\s|€/g, '').trim();
	const priceSqrM = data('.price-per').text().replace(/\(|\)|€\/m²|\s/g, '').trim();
	const details = parseDetails(data);
	const description = data('#collapsedText').text().replace(/\s+/g, ' ').trim();
	const dates = getDates(data);
	const parsedData = {
		url,
		Kaina,
		'Kaina už kvadratą': priceSqrM,
		...address,
		...details,
		'Aprašymas': description,
		'Įdėtas': dates.created,
		'Redaguotas': dates.edited
	};

	return parsedData;
}
