from pathlib import Path
import json
import random
import numpy as np
import torch
from torch import nn
from torch.utils.data import Dataset,DataLoader
from torchvision import datasets
from .imaging import digit_tensor_image
class DigitCNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.layers=nn.Sequential(nn.Conv2d(1,16,3,padding=1),nn.ReLU(),nn.MaxPool2d(2),
            nn.Conv2d(16,32,3,padding=1),nn.ReLU(),nn.MaxPool2d(2),nn.Flatten(),
            nn.Linear(32*7*7,64),nn.ReLU(),nn.Dropout(.2),nn.Linear(64,10))
    def forward(self,x):return self.layers(x)
class PreparedDigits(Dataset):
    def __init__(self,images,labels,augment=False):
        self.images=images;self.labels=labels;self.augment=augment
    def __len__(self):return len(self.labels)
    def __getitem__(self,i):
        import cv2
        im=self.images[i]
        if self.augment:
            M=cv2.getRotationMatrix2D((13.5,13.5),random.uniform(-10,10),random.uniform(.9,1.1))
            M[:,2]+=np.random.uniform(-1.5,1.5,2)
            im=cv2.warpAffine(im,M,(28,28))
        x=torch.from_numpy(im.astype('float32')/255.).unsqueeze(0)
        return x,int(self.labels[i])
def load_digit_data(root='data',dataset='MNIST'):
    if dataset=='MNIST':
        train=datasets.MNIST(root,train=True,download=True)
        test=datasets.MNIST(root,train=False,download=True)
    elif dataset=='EMNIST':
        train=datasets.EMNIST(root,split='digits',train=True,download=True)
        test=datasets.EMNIST(root,split='digits',train=False,download=True)
    else:raise ValueError('Choose MNIST or EMNIST.')
    def prepare(ds):
        images=ds.data.numpy()
        if dataset=='EMNIST':images=images.transpose(0,2,1)
        out=np.stack([digit_tensor_image(255-im) for im in images])
        return out,ds.targets.numpy()
    return prepare(train),prepare(test)
@torch.inference_mode()
def evaluate(model,loader,device):
    model.eval();truth=[];pred=[];loss_sum=0.;total=0
    for x,y in loader:
        x,y=x.to(device),y.to(device);logits=model(x)
        loss_sum+=nn.functional.cross_entropy(logits,y,reduction='sum').item();total+=len(y)
        pred.extend(logits.argmax(1).cpu().tolist());truth.extend(y.cpu().tolist())
    return {'loss':loss_sum/total,'accuracy':float(np.mean(np.array(pred)==truth))},truth,pred
def train_digit_model(output='models/digit_cnn.pt',epochs=5,dataset='MNIST',
                      root='data',seed=42,batch_size=256,train_limit=None):
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import classification_report,confusion_matrix
    if epochs<1:raise ValueError('epochs must be at least one.')
    random.seed(seed);np.random.seed(seed);torch.manual_seed(seed)
    device=torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    if device.type=='cpu':torch.set_num_threads(min(4,torch.get_num_threads()))
    (images,labels),(test_images,test_labels)=load_digit_data(root,dataset)
    idx=np.arange(len(labels))
    tr,va=train_test_split(idx,test_size=.1,stratify=labels,random_state=seed)
    if train_limit is not None and train_limit<len(tr):
        tr,_=train_test_split(tr,train_size=train_limit,stratify=labels[tr],random_state=seed)
    train_loader=DataLoader(PreparedDigits(images[tr],labels[tr],True),batch_size=batch_size,shuffle=True)
    val_loader=DataLoader(PreparedDigits(images[va],labels[va]),batch_size=batch_size)
    test_loader=DataLoader(PreparedDigits(test_images,test_labels),batch_size=batch_size)
    model=DigitCNN().to(device);optimizer=torch.optim.Adam(model.parameters(),lr=.001)
    output=Path(output);output.parent.mkdir(parents=True,exist_ok=True)
    best=-1.;history=[]
    for epoch in range(epochs):
        model.train();loss_sum=0;seen=0
        for x,y in train_loader:
            x,y=x.to(device),y.to(device);optimizer.zero_grad()
            loss=nn.functional.cross_entropy(model(x),y);loss.backward();optimizer.step()
            loss_sum+=loss.item()*len(y);seen+=len(y)
        val,_,_=evaluate(model,val_loader,device)
        row={'epoch':epoch+1,'train_loss':loss_sum/seen,'val_loss':val['loss'],'val_accuracy':val['accuracy']}
        history.append(row);print(row,flush=True)
        if val['accuracy']>best:
            best=val['accuracy']
            torch.save({'state_dict':{k:v.detach().cpu() for k,v in model.state_dict().items()},
                'dataset':dataset,'normalization':'ink_bbox_center_20_in_28_v1',
                'best_validation_accuracy':best,'seed':seed,'training_samples':len(tr)},output)
    ckpt=torch.load(output,map_location=device,weights_only=True);model.load_state_dict(ckpt['state_dict'])
    test,truth,pred=evaluate(model,test_loader,device)
    metrics={'dataset':dataset,'train_samples':len(tr),'validation_samples':len(va),
        'test_samples':len(test_labels),'test':test,'history':history,
        'classification_report':classification_report(truth,pred,output_dict=True,zero_division=0),
        'confusion_matrix':confusion_matrix(truth,pred,labels=list(range(10))).tolist(),
        'real_photo_test':'NOT RUN: no photographed forms provided',
        'note':'Benchmark digit accuracy is not whole-form accuracy or phone-photo accuracy.'}
    output.with_suffix('.metrics.json').write_text(json.dumps(metrics,indent=2))
    return metrics
class CNNRecognizer:
    def __init__(self,checkpoint,device=None):
        self.device=torch.device(device or ('cuda' if torch.cuda.is_available() else 'cpu'))
        saved=torch.load(checkpoint,map_location=self.device,weights_only=True)
        if saved.get('normalization')!='ink_bbox_center_20_in_28_v1':
            raise ValueError('Checkpoint preprocessing does not match this extractor.')
        self.model=DigitCNN().to(self.device);self.model.load_state_dict(saved['state_dict']);self.model.eval()
    @torch.inference_mode()
    def recognize(self,crops):
        if not crops:return []
        a=np.stack([digit_tensor_image(im) for im in crops]).astype('float32')/255.
        logits=self.model(torch.from_numpy(a[:,None]).to(self.device))
        conf,pred=logits.softmax(1).max(1)
        return list(zip(pred.cpu().tolist(),conf.cpu().tolist()))
