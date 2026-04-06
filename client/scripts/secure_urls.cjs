const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

function findAndReplace(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findAndReplace(fullPath);
    } else if (fullPath.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let modified = false;

      // Ensure import is present if we are going to modify
      const addImportIfNeeded = () => {
        if (!content.includes('import { encodeId') && !content.includes('import { decodeId')) {
          // calculate relative path to utils/idEncoder
          let relPath = path.relative(path.dirname(fullPath), path.join(srcDir, 'utils', 'idEncoder'));
          relPath = relPath.replace(/\\/g, '/');
          if (!relPath.startsWith('.')) relPath = './' + relPath;
          
          let importStatement = '';
          if (
            content.includes('decodeId(') || 
            file === 'VehicleDetailsPage.jsx' || 
            file === 'CheckoutPage.jsx' || 
            file === 'BookingSuccessPage.jsx' || 
            file === 'ExploreMapPage.jsx'
          ) {
             importStatement = `import { encodeId, decodeId } from "${relPath}";\n`;
          } else {
             importStatement = `import { encodeId } from "${relPath}";\n`;
          }
          
          content = importStatement + content;
        }
      };

      // Handle Component routing links
      if (content.includes('`/car/${')) {
        content = content.replace(/`\/car\/\$\{([^}]+)\}`/g, '`/car/${encodeId($1)}`');
        modified = true;
      }
      if (content.includes('"/car/${')) {
        content = content.replace(/"\/car\/\$\{([^}]+)\}"/g, '`/car/${encodeId($1)}`');
        modified = true;
      }
      if (content.includes('`/booking/${')) {
        content = content.replace(/`\/booking\/\$\{([^}]+)\}`/g, '`/booking/${encodeId($1)}`');
        modified = true;
      }
      if (content.includes('`/booking-success/${')) {
        content = content.replace(/`\/booking-success\/\$\{([^}]+)\}`/g, '`/booking-success/${encodeId($1)}`');
        modified = true;
      }
      if (content.includes('`/map?car=${')) {
        content = content.replace(/`\/map\?car=\$\{([^}]+)\}`/g, '`/map?car=${encodeId($1)}`');
        modified = true;
      }

      // Special decoding Logic for specific files
      if (file === 'VehicleDetailsPage.jsx') {
        const idMatch = content.match(/const\s*{\s*id\s*}\s*=\s*useParams\(\);/);
        if (idMatch) {
          content = content.replace(
            /const\s*{\s*id\s*}\s*=\s*useParams\(\);/,
            'const { id: rawId } = useParams();\n  const id = decodeId(rawId);'
          );
          modified = true;
        }
      }

      if (file === 'CheckoutPage.jsx') {
        const idMatch = content.match(/const\s*{\s*id\s*}\s*=\s*useParams\(\);/);
        if (idMatch) {
          content = content.replace(
            /const\s*{\s*id\s*}\s*=\s*useParams\(\);/,
            'const { id: rawId } = useParams();\n  const id = decodeId(rawId);'
          );
          modified = true;
        }
      }

      if (file === 'BookingSuccessPage.jsx') {
        const idMatch = content.match(/const\s*{\s*bookingId\s*}\s*=\s*useParams\(\);/);
        if (idMatch) {
          content = content.replace(
            /const\s*{\s*bookingId\s*}\s*=\s*useParams\(\);/,
            'const { bookingId: rawId } = useParams();\n  const bookingId = decodeId(rawId);'
          );
          modified = true;
        }
      }

      if (file === 'ExploreMapPage.jsx') {
        if (content.includes('searchParams.get("car")')) {
          content = content.replace(/searchParams\.get\("car"\)/g, 'decodeId(searchParams.get("car"))');
          modified = true;
        }
      }

      if (modified) {
        addImportIfNeeded();
        fs.writeFileSync(fullPath, content);
        console.log('Modified', file);
      }
    }
  }
}

findAndReplace(srcDir);
console.log("Done");
