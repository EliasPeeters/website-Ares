let fs = require('fs');
let cite = require('citation-js');
const bibtexParse = require('bibtex-parse');
const { BibEntry } = require('bibtex');

let bibBlackList = ['TITLE', 'URL', 'key'];

function loadBib(name) {
    let data = fs.readFileSync(`papers/${name}Bib.bib`, {encoding:'utf8'});
    let bib = bibtexParse.entries(data);
    return bib;
}

function searchForBibEntry(bib, key) {
    for (element in bib) {
        if (bib[element].key == key) {
            return bib[element]
        }
    }
    return {TITLE: key};
}

function removeBackslashFromString(string) {
    if (string == undefined) {
        return undefined
    }
    while (string.indexOf('\\') != -1) {
        string = [string.substring(0, string.indexOf('\\')), string.substring(string.indexOf('\\') + 1, string.length)].join('');
    }
    return string;
}

function parsePaperData(data, bib) {
    let dataSub = data;
    let firstFunction = true;
    let x = 0;
    while (dataSub.indexOf("\\") != -1) {
        let backslashPosition = dataSub.indexOf("\\");
        let nextOpenCurlyBracket = dataSub.indexOf('{');
        let nextClosingCurlyBracket = dataSub.indexOf('}');
        let functionParam = dataSub.substring(nextOpenCurlyBracket+1, nextClosingCurlyBracket);
        let test = dataSub.substring(backslashPosition, backslashPosition+20);
        let nextOpenReactBracket = dataSub.substring(backslashPosition, dataSub.length).indexOf('[');
        if (nextOpenReactBracket == -1) {
            nextOpenReactBracket = dataSub.length +1;
        } else {
            nextOpenReactBracket += backslashPosition;
        }
        let functionName;
        if (nextOpenCurlyBracket < nextOpenReactBracket) {
            functionName = dataSub.substring(dataSub.indexOf("\\")+1, nextOpenCurlyBracket)
        } else {
            functionName = dataSub.substring(dataSub.indexOf("\\")+1, nextOpenReactBracket)
        }
        // check for glqq
        if (functionName.substring(0, 4) == 'glqq') {
            functionName = 'glqq'
        }

        // check for %
        if (functionName.substring(0, 1) == '%') {
            functionName = '%';
        }

        // check for \S == §
        if (functionName.substring(0, 1) == 'S') {
            functionName = 'S';
        }

        switch(functionName) {
            case 'section': 
                let insertString = firstFunction? `<h3>${functionParam}</h3><p>`: `</p><h3>${functionParam}</h3><p>`;
                dataSub = [dataSub.substring(0, dataSub.indexOf("\\")), insertString, dataSub.substring(nextClosingCurlyBracket+1, dataSub.lenght)].join('')
                break;
            case 'subsection': 
                dataSub = [dataSub.substring(0, dataSub.indexOf("\\")), `</p><h4>${functionParam}</h4><p>`, dataSub.substring(nextClosingCurlyBracket+1, dataSub.lenght)].join('')
                break;
            case 'autocite':
                let content = `{name: ${functionParam}}`
                //console.log(content)
                let bibEntry = searchForBibEntry(bib, functionParam);
                let bibEntryArray = []
                for (element in bibEntry) {
                    if (!bibBlackList.includes(element)) {
                        bibEntryArray.push(`${element.toLowerCase()}: ${removeBackslashFromString(bibEntry[element])}`);
                    }
                }
                let bibEntryString = "`" + bibEntryArray.join("`, `") + "`";
                //console.log(bibEntryString)
                let functionCall = `openPaperPopUp(event,'${functionParam}', '${bibEntry.TITLE}', [${bibEntryString}], '${bibEntry.URL}')`;
                let bTag = `<b class="${functionParam}" onclick="${functionCall}" onmouseover="${functionCall}">[Q]</b>`;
                if (functionParam.substring(0,3) == 'fig') {
                    bTag = ''
                }
                dataSub = [dataSub.substring(0, dataSub.indexOf("\\")), bTag , dataSub.substring(nextClosingCurlyBracket+1, dataSub.lenght)].join('')
                break;
            case 'glqq':
                dataSub = [dataSub.substring(0, dataSub.indexOf("\\")), `"`, dataSub.substring(dataSub.indexOf("\\")+6, dataSub.lenght)].join('')
                break;
            case 'grqq':
                dataSub = [dataSub.substring(0, dataSub.indexOf("\\")), `"`, dataSub.substring(nextClosingCurlyBracket+1, dataSub.lenght)].join('')
                break;
            case '%':
                dataSub = [dataSub.substring(0, dataSub.indexOf("\\")), `%`, dataSub.substring(dataSub.indexOf("\\")+2, dataSub.lenght)].join('');
                break;
            case 'S':
                dataSub = [dataSub.substring(0, dataSub.indexOf("\\")), `§`, dataSub.substring(dataSub.indexOf("\\")+2, dataSub.lenght)].join('')
                break;
        }
        firstFunction = false;
    }

    // Adding returns
    while (dataSub.indexOf('\n') != -1) {
        let position = dataSub.indexOf('\n');
        dataSub = [dataSub.substring(0, position), '</p><p>', dataSub.substring(position+1, dataSub.length)].join('');
    }

    // Removing empty p
    while (dataSub.indexOf('<p></p>') != -1) {
        dataSub = [dataSub.substring(0, dataSub.indexOf('<p></p>')), dataSub.substring(dataSub.indexOf('<p></p>')+7, dataSub.length)].join('')
    }

    // dataSub = dataSub + '</p>'
    return dataSub;

}

app.get('/paper/:name', (req, res) => {
    let name = req.params.name;

    let attributes = JSON.parse(fs.readFileSync('assets/data.json'));
    let bib = loadBib(name)
    if (attributes[name] == undefined) {
        res.send('Paper does not exist');
        return;
    } 
    let data = fs.readFileSync(`papers/${name}.tex`, {encoding:'utf8'});
    searchForBibEntry(bib, 'ParteienspektrumD')
    data = parsePaperData(data, bib)
    res.send({
        paper: data,
        heading: attributes[name].heading,
        date: attributes[name].date,
        authors: attributes[name].authors
    })
})