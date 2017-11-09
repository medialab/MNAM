import csv
import time
import operator

from pprint import pprint

from sklearn.feature_extraction.text import CountVectorizer
from sklearn.feature_extraction.text import TfidfVectorizer

from collections import defaultdict



def update(count, words):
	for word in [w for w in words if len(w) > 2]:
		count[word] += 1

	return count


def save_topwords(count, filename, n_best=100):
	with open(filename, 'w') as f:
		for i in count[:n_best]:
			f.write('{}, {}\n'.format(i[0], i[1]))


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
pprint(theme_count[:100])

print('\n[ + ] Ico')
pprint(ico_count[:100])

print('\n[ + ] Materiaux')
pprint(mat_count[:100])

print('\n[ + ] Mouvements')
pprint(mov_count[:100])

save_topwords(theme_count, 'thematique.csv')
save_topwords(ico_count, 'iconographique.csv')
save_topwords(mov_count, 'mouvement.csv')
save_topwords(mat_count, 'materiaux.csv')

			
		