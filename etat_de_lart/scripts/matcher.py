import editdistance as dist
import multiprocessing as mp
import progressbar
import time

from progressbar import progressbar as pg
from pprint import pprint


'''
Installations:
    pip install editdistance
    pip install progressbar2
'''


# Progressbar widget
widgets=[
    ' [', progressbar.Timer(), '] ',
    progressbar.Bar(),
    ' (', progressbar.ETA(), ') ',
]


def alpha_sort(str):
    '''
        Used to clean strings before computing similarity score.
    '''
    str = str.lower().split(' ')
    str = sorted(str)
    return ' '.join(str)


def chunks(l, n):
    '''
        Chunk a list in n even parts.
        Parameters
            l: list of object
            n: number of chunks to return
        Returns
            generator
    '''
    n = max(1, n)
    return (l[i:i+n] for i in range(0, len(l), n))


def match(list1, list2, threshold=0.75):
    '''
        Compute the similarity score between strings from list1 and strings
        from list2 based on the Levensthein distance.

        Parameters
            list1, list2: lists of strings
            threshold: minimum score needed to consider two strings as matched
                (between 0 and 1, where 0 is no match and 1 is perfect match)
        Returns
            matched: list of dict
    '''
    matched = []
    for a, _ in zip(list1, pg(range(len(list1)), widgets=widgets)):
        for b in list2:
            a_ = alpha_sort(a)
            b_ = alpha_sort(b)
            d = 1 - dist.eval(a_, b_) / max(len(a_), len(b_))
            if d > threshold:
                matched.append({'list1': a,
                                'list2': b,
                                'score': round(d, 3)})
    return matched


def match_job(str, chunk, threshold):
    '''
        Compute the similarity score between a single string and strings
        from chunk based on the Levensthein distance.

        Parameters
            chunk: lists of strings
            threshold: minimum score needed to consider two strings as matched
                (between 0 and 1, where 0 is no match and 1 is perfect match)
        Returns
            matched: list of dict
    '''
    matched = []
    for seq in chunk:
        seq_ = alpha_sort(seq)
        str_ = alpha_sort(str)
        d = 1 - dist.eval(str_, seq_) / max(len(str_), len(seq_))
        if d > threshold:
            matched.append({'list1': str,
                            'list2': seq,
                            'score': round(d, 3)})
    return matched



def match_parallel(list1, list2, threshold=0.75):
    '''
        Compute the similarity score between strings from list1 and strings
        from list2 based on the Levensthein distance. Unlike match(), this
        function uses multiprocessing to compute scores.

        In order for this function to be efficient, the length of list1 should
        be superior to the length of list2.

        Parameters
            list1, list2: lists of strings
            threshold: minimum score needed to consider two strings as matched
                (between 0 and 1, where 0 is no match and 1 is perfect match)
        Returns
            matched: list of dict
    '''
    if len(list1) > len(list2):
        print('\n[ ! ] WARNING: parameter list1 should contain the smallest',
              'array. Otherwise computation time might be extanded.\n')
        if str(input('Are you sure you want to keep going with no changes? [y/n]: ')) == 'y':
            pass
        else:
            exit()

    matched = []

    # Prepare data for parallelization
    n_cores = mp.cpu_count()
    list2_chunks = chunks(list2, n_cores)

    for a, _ in zip(list1, pg(range(len(list1)), widgets=widgets)):

        # Define jobs parameters
        job_parameters = []
        for c in list2_chunks:
            job_parameters.append((a, c, threshold))

        # Parallelize score computation
        with mp.Pool(processes=n_cores) as p:
            results = p.starmap(match_job, job_parameters)

        # Yield results
        for r in results:
            matched += r

    return matched



def test():
    l1 = ['john mitchell', 'mark bronson', 'mary duchell']*40
    l2 = ['john mitchell', 'john michell', 'mark bronson',
          'mark bron', 'mary duchell', 'm. duc']*10000

    # Test match(...)
    print('[ + ] Using match(...) with list1 size', len(l1),
          'and list2 of size', len(l2), '\n')
    match(l1, l2)

    print('\n\n')

    # Test match_parallel(...)
    print('[ + ] Using match_parallel(...) with list1 size', len(l1),
          'and list2 of size', len(l2), '\n')
    match_parallel(l1, l2)

    print('\n\n')
    print('\n[ + ] Done testing')


test()
