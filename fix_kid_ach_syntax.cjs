const fs = require('fs');
let content = fs.readFileSync('src/components/KidDashboard.tsx', 'utf8');

const oldSyntax = `                      )}
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 text-right">`;

const newSyntax = `                      )}
                    </div>
                    <div className="shrink-0 text-right">`;

content = content.replace(oldSyntax, newSyntax);
fs.writeFileSync('src/components/KidDashboard.tsx', content);
