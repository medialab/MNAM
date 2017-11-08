import pymongo
import csvkit
import re

db = pymongo.MongoClient("localhost", 27017)["mnam"]

headers = ["_id",
 "title",
 "domaine",
 "mode_acquisition",
 "mode_acquisition_cleaned",
 "acquisition_date",
 "creation_date",
 "creation_year",
 "gender",
 "artist_ids",
 "artist_names",
 "artist_nationalities",
 "artist_birthdeath",
 ]

artists = db.Artwork.aggregate([
    {"$match": {"notEnsemble":True}},
    {"$project":{
        "title": "$title_notice",
        "domaine": "$domain",
        "mode_acquisition": "$acquisition_mode",
        "acquisition_date": "$acquisition_year",
        "creation_date": "$date_creation",
        "gender": 1,
        "artist_ids": "$authors",
        "artist_names": "$authors_list",
        "artist_birthdeath": "$authors_birth_death",
        "artist_nationalities": "$authors_nationality",
    }}
    ])

acquisition_mode_cleaning = {"Achat":"Achat",
"Achat en vente publique":"Achat",
"Achat par commande":"commande",
"Achat par préemption":"Achat",
"Achat sur les arrérages d'un legs":"Achat",
"Attribution Etat":"Attribution",
"Attribution Fonds national d'art contemporain":"Attribution",
"Attribution":"Attribution",
"Attribution par l'office des Biens et Intérêts Privés":"Attribution",
"Attribution Musée du Luxembourg":"Attribution",
"Attribution Musée du Jeu de Paume":"Attribution",
"Attribution Musée national d'art moderne / Centre de création industrielle":"Attribution",
"Attribution Centre Pompidou":"Attribution",
"Attribution Musées nationaux":"Attribution",
"Attribution Réunion des Musées Nationaux":"Attribution",
"Attribution Les Arts Décoratifs":"Attribution",
"Attribution Mobilier national et Manufactures des Gobelins, de Beauvais et de la Savonnerie":"Attribution",
"Dation":"Dation",
"Dépôt Centre Pompidou Foundation":"Dépôt entrant",
"Dépôt Centre national des arts plastiques":"Dépôt entrant",
"Dépôt":"Dépôt entrant",
"Dépôt Bibliothèque littéraire Jacques Doucet":"Dépôt entrant",
"Dépôt Centre international d'art et du paysage de l'île de Vassivière":"Dépôt entrant",
"Dépôt Direction des musées de France":"Dépôt entrant",
"Dépôt Etablissement public des musées d'Orsay et de l'Orangerie":"Dépôt entrant",
"Dépôt Etablissement public pour l'aménagement de la région de la Défense":"Dépôt entrant",
"Dépôt Fonds national d'art contemporain":"Dépôt entrant",
"Dépôt Mobilier national et Manufactures des Gobelins, de Beauvais et de la Savonnerie":"Dépôt entrant",
"Dépôt Musée national Picasso":"Dépôt entrant",
"Dépôt Société des Amis du Musée national d'art moderne":"Dépôt entrant",
"Dépôt Siège national du Parti communiste français":"Dépôt entrant",
"Dépôt Association française d'action artistique": "Dépôt entrant",
"Don":"Don",
"Donation":"Donation",
"Echange":"Echange",
"Inscription à l'inventaire":"Inscription à l'inventaire",
"Legs":"Legs",
"Mode d'acquisition mixte, voir détail sur les éléments":"Mode d'acquisition mixte",
"Mode d'acquisition non renseigné":"Mode d'acquisition non renseigné",
"Saisie de l'Administration des Douanes":"Saisie",
"Saisie":"Saisie"}




centuries_approximations = { "début XXe siècle":"1900 - 1930",
            "fin XIXe siècle - début XXe siècle": "1880 - 1930",
            "1ère moitié XXe siècle":"1900 - 1950",
            "milieu de XIXe siècle": "1830 - 1860",
            "XIXe siècle": "1800 - 1899",
            "XVIIIe siècle": "1700 - 1799",
            "vers XVIIe siècle": "1600 - 1699"}
years_re = re.compile(r"\d{4}")

def clean_creation_date(acquisition_date, creation_date):
    years = years_re.findall(creation_date)
    if len(years)>=1:
        return min(years)
    else:
        return ''

artists = list(artists)
for artist in artists:
    if "creation_date" in artist:
        if artist["creation_date"] in centuries_approximations:
            artist["creation_year"] = clean_creation_date(artist["acquisition_date"]if 'acquisition_date' in artist else None, centuries_approximations[artist['creation_date']])
        else:
            artist["creation_year"] = clean_creation_date(artist["acquisition_date"]if 'acquisition_date' in artist else None, artist['creation_date'])
    else:
        artist['creation_year']=''           

    #print(artist['acquisition_date'] if 'acquisition_date' in artist else 'N/A', artist["creation_date"] if 'creation_date' in artist else 'N/A', artist['creation_year'])

    artist['mode_acquisition_cleaned'] = acquisition_mode_cleaning[artist['mode_acquisition'].strip(' ')]


with open("acquisitions.csv", "w") as f:
    artists_csv = csvkit.DictWriter(f,fieldnames = headers)
    artists_csv.writeheader()
    artists_csv.writerows(artists)