echo "Domain name (example.com): "
read domain
echo "Item hash program: "
read program
aleph domain add --target program --item-hash $program --no-ask $domain