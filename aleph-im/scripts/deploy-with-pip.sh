rm -rf aleph-im/api/__pycache__
rm -r ./aleph-im/api/static
mkdir ./aleph-im/api/static
cp -r ./out/* ./aleph-im/api/static
echo "Item hash dependency volume: "
read volume
aleph program upload aleph-im/api main:app --runtime=0a11fecb09bf51fcfc38f8227401658417cd0af2589b2a236a0e32899b6b8910 --immutable-volume ref=$volume,mount=/opt/packages