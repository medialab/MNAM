import csv
import time
import operator

from sklearn.feature_extraction.text import CountVectorizer
from sklearn.feature_extraction.text import TfidfVectorizer

from collections import defaultdict
from itertools import combinations
from pprint import pprint



def update(count, words):

	pairs = list(combinations(words, 2))
	pairs = [tuple(sorted(w.replace('\n', '') for w in p)) for p in pairs]		
	
	for p in pairs:
		count[p] += 1

	return count


def save_topwords(count, filename):
	with open(filename, 'w') as f:
		f.write("Source,Target,Weight\n")
		for i in count:
			f.write('"{}","{}",{}\n'.format(i[0][0], i[0][1], i[1]))


theme_count = defaultdict(lambda: 0)
ico_count = defaultdict(lambda: 0)
mov_count = defaultdict(lambda: 0)
mat_count = defaultdict(lambda: 0)

filename = '/home/akira/Documents/Dev/Datasprint/textfields.csv'
with open(filename, 'r') as f:
	reader = csv.reader(f)
	next(reader)
	t = time.time()
	
	for row in reader:

		theme = row[2].split(', ')
		ico = row[3].split(', ')
		mov = row[1].split(', ')
		mat = row[4].split(', ')

		update(theme_count, theme)
		update(ico_count, ico)
		update(mov_count, mov)
		update(mat_count, mat)


theme_count = sorted(theme_count.items(), key=operator.itemgetter(1), reverse=True)
ico_count = sorted(ico_count.items(), key=operator.itemgetter(1), reverse=True)
mov_count = sorted(mov_count.items(), key=operator.itemgetter(1), reverse=True)
mat_count = sorted(mat_count.items(), key=operator.itemgetter(1), reverse=True)

print('\n[ + ] Theme')
pprint(theme_count[:10])

print('\n[ + ] Ico')
pprint(ico_count[:10])

print('\n[ + ] Materiaux')
pprint(mat_count[:10])

print('\n[ + ] Mouvements')
pprint(mov_count[:10])

'''
save_topwords(theme_count, 'thematique_co.csv')
save_topwords(ico_count, 'iconographique_co.csv')
save_topwords(mov_count, 'mouvement_co.csv')
save_topwords(mat_count, 'materiaux_co.csv')
'''
			
