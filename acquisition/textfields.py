import pymongo
import csvkit

db = pymongo.MongoClient("localhost", 27017)["mnam"]

headers = [
"_id",
"key_words_movement",
"key_words_thema",
"key_words_icono",
"domain_description_mst"]




tf = db.Artwork.aggregate([
    {"$match":{"notEnsemble":True}},
    {"$project":{
    "key_words_movement": 1,
    "key_words_thema": 1,
    "key_words_icono": 1,
    "domain_description_mst": 1
    }}
    ])
with open("textfields.csv", "w") as f:
    csv = csvkit.DictWriter(f,fieldnames = headers)
    csv.writeheader()
    csv.writerows(tf)