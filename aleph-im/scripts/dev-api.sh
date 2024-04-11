cd aleph-im/api
rm -r ./aleph-im/api/static
mkdir ./aleph-im/api/static
cp -r ./out/* ./aleph-im/api/static
python -m uvicorn test:app --reload --host=127.0.0.1 --port=8000