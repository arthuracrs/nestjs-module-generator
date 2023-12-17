const fs = require('fs');
const path = require('path');
const maping = require("./newModuleContent")

function main(maping, args) {
    maping(args).forEach(item => {
        const { fileName, content } = item;
        const filePath = path.join(__dirname, fileName);

        // Create folders if they don't exist
        const folderPath = path.dirname(filePath);
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        // Write content to file
        fs.writeFileSync(filePath, content, (err) => {
            if (err) throw err;
            console.log(`${fileName} has been created successfully.`);
        });
    });
}

main(maping, { moduleName: "StudentInvitation" })