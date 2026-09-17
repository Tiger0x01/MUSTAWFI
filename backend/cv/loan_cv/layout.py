PAGE_W, PAGE_H = 595.276, 841.890
LAYOUT_ID = 'PDF_Example-v1'
FEATURES = ['person_age', 'person_gender', 'person_education', 'person_income',
            'person_emp_exp', 'person_home_ownership', 'loan_amnt', 'loan_intent',
            'loan_int_rate', 'loan_percent_income', 'cb_person_cred_hist_length',
            'credit_score', 'previous_loan_defaults_on_file']
NUMERIC = {
    'person_age': (50, 647, 3, 0),
    'person_emp_exp': (309, 647, 3, 0),
    'person_income': (50, 598, 12, 2),
    'loan_amnt': (50, 549, 12, 2),
    'loan_int_rate': (50, 253, 2, 2),
    'credit_score': (309, 253, 3, 0),
    'cb_person_cred_hist_length': (50, 191, 3, 0),
}
CHOICES = {
    'person_gender': [('female',180,500), ('male',300,500)],
    'person_education': [('High School',50,450),('Associate',158,450),
                         ('Bachelor',255,450),('Master',348,450),('Doctorate',433,450)],
    'person_home_ownership': [('RENT',50,400),('OWN',180,400),
                              ('MORTGAGE',309,400),('OTHER',445,400)],
    'loan_intent': [('PERSONAL',50,350),('EDUCATION',210,350),('MEDICAL',382,350),
                    ('VENTURE',50,328),('HOMEIMPROVEMENT',210,328),
                    ('DEBTCONSOLIDATION',382,328)],
    'previous_loan_defaults_on_file': [('Yes',309,166),('No',409,166)],
}
PRESENCE = {'name_present': (50,71,292,34), 'signature_present': (360,71,185,34)}
MARKERS = [(26,799.890,12,12),(557.276,799.890,12,12),(557.276,27,12,12),(26,27,12,12)]
ORIENTATION_DOT = (44.5,803.390,5,5)
def pixels(rect, shape, inset=0):
    """PDF (x,y,width,height) -> integer pixel (left,top,right,bottom)."""
    x,y,w,h=rect; height,width=shape[:2]
    return (round((x+inset)/PAGE_W*width), round((PAGE_H-y-h+inset)/PAGE_H*height),
            round((x+w-inset)/PAGE_W*width), round((PAGE_H-y-inset)/PAGE_H*height))
def numeric_rects(spec):
    x,y,n,d=spec
    return [(x+i*21,y-31,18,23) for i in range(n)] + [
        (x+n*21+9+i*21,y-31,18,23) for i in range(d)]
def crop(image, rect, inset=1.5):
    x1,y1,x2,y2=pixels(rect,image.shape,inset)
    return image[y1:y2,x1:x2].copy()
