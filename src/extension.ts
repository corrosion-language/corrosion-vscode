import * as vscode from "vscode";

const tokenTypes = ["variable"];
const tokenModifiers = ["declaration"];
const legend = new vscode.SemanticTokensLegend(tokenTypes, tokenModifiers);

const provider: vscode.DocumentSemanticTokensProvider = {
	provideDocumentSemanticTokens(document: vscode.TextDocument): vscode.ProviderResult<vscode.SemanticTokens> {
		const tokensBuilder = new vscode.SemanticTokensBuilder(legend);
		let vars: String[] = [];
		for (let i = 0; i < document.lineCount; i++) {
			let tmpline = document.lineAt(i).text;
			let linepos = tmpline.indexOf("//");
			linepos = linepos < 0 ? tmpline.length - 1 : linepos - 1;
			for (; linepos >= 0; linepos--) {
				if (tmpline[linepos] != " " && tmpline[linepos] != "\t") break;
			}
			tmpline = tmpline.substring(0, linepos + 1);
			for (linepos = 0; linepos < tmpline.length; linepos++) {
				if (tmpline[linepos] != " " && tmpline[linepos] != "\t") break;
			}
			tmpline = tmpline.substring(linepos);
			tmpline.replace(/\s+/g, " ");
			linepos = 0;
			while (linepos < tmpline.length - 1 && linepos >= 0) {
				let line = tmpline.substring(linepos);
				let pos = line.indexOf("var:");
				if (pos >= 0) {
					let varBegin = line.indexOf(" ", pos + 5);
					if (varBegin++ >= 0) {
						let varEnd = varBegin + 1;
						for (; varEnd < line.length; varEnd++) {
							if (line[varEnd].match(/[a-zA-Z0-9_]/) === null) break;
						}
						let varName = line.substring(varBegin, varEnd);
						vars.push(varName);
						tokensBuilder.push(new vscode.Range(i, varBegin + linepos, i, varEnd + linepos), "variable", [
							"declaration",
						]);
						linepos += varEnd;
						continue;
					}
				}
				let best = -1;
				pos = tmpline.length;
				for (let v of vars) {
					let tmppos = line.search(`\\b${v}\\b`);
					if (tmppos >= 0 && tmppos < pos) {
						pos = Math.min(pos, tmppos);
						best = v.length;
					}
				}
				if (best != -1) {
					tokensBuilder.push(new vscode.Range(i, pos + linepos, i, pos + linepos + vars[0].length), "variable");
					linepos += pos + best;
				} else {
					linepos += tmpline.length;
				}
			}
		}
		return tokensBuilder.build();
	},
};

const selector = { language: "cor", scheme: "file" }; // register for all Java documents from the local file system

vscode.languages.registerDocumentSemanticTokensProvider(selector, provider, legend);
